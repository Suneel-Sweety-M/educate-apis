import userModel from "../models/User.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Joi from "joi";

const userValidationSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(30)
        .required()
        .messages({
            "string.base": "Name should be a string",
            "string.empty": "Name cannot be empty",
            "string.min": "Name must be at least 3 characters long",
            "string.max": "Name must be at most 30 characters long",
            "any.required": "Name is required"
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            "string.email": "Email must be valid",
            "any.required": "Email is required"
        }),
    password: Joi.string()
        .min(6)
        .required()
        .messages({
            "string.min": "Password must be at least 6 characters",
            "any.required": "Password is required"
        }),
    role: Joi.string()
        .valid('teacher', 'user')
        .default('user')
        .messages({
            "string.valid": "Role must be either 'teacher' or 'user'",
            "string.base": "Role must be a string"
        })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
    password: Joi.string()
        .min(6)
        .required()
        .messages({
            "string.min": "Password must be at least 6 characters",
            "any.required": "Password is required"
        })
});

const otpSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(4).required()
});

// Token generator functions
const generateAccessToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'
    });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
    });
};

const generateResetToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });
};

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate random 4-digit OTP
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

// Cookie options for secure storage
const accessTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
};

const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const REGISTER = async (req, res, next) => {
    const { error } = userValidationSchema.validate(req.body);
    if (error) {
        error.statusCode = 400;
        return next(error);
    }

    const { name, email, password, role } = req.body;

    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
                success: false
            });
        }

        const otp = generateOTP();
        const hashedPassword = await bcrypt.hash(password, 12);

        // Store user data temporarily with OTP
        const tempUser = await userModel.create({
            name,
            email,
            password: hashedPassword,
            role: role && ['teacher', 'user'].includes(role) ? role : 'user',
            otp,
            otpExpires: Date.now() + 10 * 60 * 1000 // OTP valid for 10 minutes
        });

        // Send OTP email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Registration OTP Verification',
            html: `
                <h2>Verify Your Email</h2>
                <p>Your OTP for registration is: <strong>${otp}</strong></p>
                <p>This OTP will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: "OTP sent to your email",
            success: true,
            email: email,
            tempUserId: tempUser._id
        });

    } catch (err) {
        err.statusCode = 500;
        next(err);
    }
};

const VERIFY_OTP = async (req, res, next) => {
    const { error } = otpSchema.validate(req.body);
    if (error) {
        error.statusCode = 400;
        return next(error);
    }

    const { email, otp } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        // Clear OTP and activate user
        user.otp = null;
        user.otpExpires = null;
        user.isVerified = true;
        await user.save();

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // Store tokens in cookies
        res.cookie('accessToken', accessToken, accessTokenCookieOptions);
        res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

        res.status(201).json({
            message: "User registered successfully",
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        err.statusCode = 500;
        next(err);
    }
};

const RESEND_OTP = async (req, res, next) => {
    const { error } = forgotPasswordSchema.validate(req.body);
    if (error) {
        error.statusCode = 400;
        return next(error);
    }

    const { email } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Registration OTP Verification',
            html: `
                <h2>Verify Your Email</h2>
                <p>Your new OTP for registration is: <strong>${otp}</strong></p>
                <p>This OTP will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: "New OTP sent to your email"
        });
    } catch (err) {
        err.statusCode = 500;
        next(err);
    }
};

const LOGIN = async (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        error.statusCode = 400;
        return next(error);
    }

    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email first"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate access and refresh tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // Store the refresh token in DB for future validation / rotation
        user.refreshToken = refreshToken;
        await user.save();

        /**
         * Why we are sending both tokens:
         * 
         * - accessToken: Short-lived token used for authenticating API requests.
         * - refreshToken: Long-lived token used to issue a new access token when the old one expires.
         * 
         * Storing both as cookies allows seamless token refresh on the client side
         * without forcing the user to log in again.
         */

        // Set tokens in HTTP-only cookies for better security
        res.cookie('accessToken', accessToken, accessTokenCookieOptions);
        res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

        // Respond with user details (excluding sensitive data)
        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        err.statusCode = 500;
        next(err);
    }
};

const LOGOUT = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            const user = await userModel.findById(userId);
            if (user) {
                user.refreshToken = null;
                await user.save();
            }

            // Clear cookies
            res.clearCookie('accessToken', accessTokenCookieOptions);
            res.clearCookie('refreshToken', refreshTokenCookieOptions);

            return res.status(200).json({
                success: true,
                message: "Logged out successfully"
            });
        } catch (error) {
            if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
                res.clearCookie('accessToken', accessTokenCookieOptions);
                res.clearCookie('refreshToken', refreshTokenCookieOptions);
                return res.status(401).json({
                    success: false,
                    message: "Invalid or expired token"
                });
            }
            throw error;
        }
    } catch (err) {
        err.statusCode = 500;
        next(err);
    }
};

const ME = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            res.clearCookie('accessToken', accessTokenCookieOptions);
            res.clearCookie('refreshToken', refreshTokenCookieOptions);
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });
        }
        err.statusCode = 500;
        next(err);
    }
};

const FORGOT_PASSWORD = async (req, res, next) => {
    const { error } = forgotPasswordSchema.validate(req.body);
    if (error) {
        error.statusCode = 400;
        return next(error);
    }

    const { email } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const resetToken = generateResetToken(user._id);
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <h2>Password Reset</h2>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: "Password reset link sent to your email"
        });
    } catch (err) {
        err.statusCode = 500;
        next(err);
    }
};

const RESET_PASSWORD = async (req, res, next) => {
    const { error } = resetPasswordSchema.validate(req.body);
    if (error) {
        error.statusCode = 400;
        return next(error);
    }

    const { token } = req.params;
    const { password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
        user.refreshToken = null;
        await user.save();

        // Clear cookies on password reset
        res.clearCookie('accessToken', accessTokenCookieOptions);
        res.clearCookie('refreshToken', refreshTokenCookieOptions);

        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (err) {
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }
        err.statusCode = 500;
        next(err);
    }
};

export { REGISTER, LOGIN, LOGOUT, ME, FORGOT_PASSWORD, RESET_PASSWORD, VERIFY_OTP, RESEND_OTP };