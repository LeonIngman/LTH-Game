/**
 * Authentication Utilities
 * Secure utilities for password hashing, session management, input validation, and security
 */

import bcryptjs from 'bcryptjs'
import crypto from 'crypto'

// Password Security
export async function hashPassword(password: string): Promise<string> {
    return await bcryptjs.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcryptjs.compare(password, hashedPassword)
}

export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long')
    }

    if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter')
    }

    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter')
    }

    if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number')
    }

    if (!/(?=.*[!@#$%^&*])/.test(password)) {
        errors.push('Password must contain at least one special character')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

// Session Security
export function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex')
}

export function calculateSessionExpiry(startDate: Date, daysToAdd: number): Date {
    const expiry = new Date(startDate)
    expiry.setDate(expiry.getDate() + daysToAdd)
    return expiry
}

export function isSessionExpired(expiryDate: Date): boolean {
    return expiryDate.getTime() < Date.now()
}

// Input Validation
export function validateUsername(username: string): { isValid: boolean; error: string | null } {
    if (!username) {
        return { isValid: false, error: 'Username is required' }
    }

    if (username.length < 3 || username.length > 20) {
        return { isValid: false, error: 'Username must be between 3 and 20 characters' }
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return { isValid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' }
    }

    return { isValid: true, error: null }
}

export function sanitizeInput(input: string): string {
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/[<>'"]/g, '') // Remove dangerous characters
        .trim() // Remove leading/trailing whitespace
}

// Cookie Security
export function getSecureCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production'

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' as const : 'lax' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/'
    }
}

// Rate Limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: Date; locked: boolean }>()

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export function trackLoginAttempt(ip: string, success: boolean): void {
    const now = new Date()
    const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: now, locked: false }

    if (success) {
        // Reset on successful login
        loginAttempts.delete(ip)
        return
    }

    // Check if lockout period has expired
    if (attempts.locked && (now.getTime() - attempts.lastAttempt.getTime()) > LOCKOUT_DURATION) {
        attempts.locked = false
        attempts.count = 0
    }

    attempts.count += 1
    attempts.lastAttempt = now

    if (attempts.count >= MAX_ATTEMPTS) {
        attempts.locked = true
    }

    loginAttempts.set(ip, attempts)
}

export function isRateLimited(ip: string): boolean {
    const attempts = loginAttempts.get(ip)

    if (!attempts || !attempts.locked) {
        return false
    }

    // Check if lockout period has expired
    const now = new Date()
    if ((now.getTime() - attempts.lastAttempt.getTime()) > LOCKOUT_DURATION) {
        attempts.locked = false
        attempts.count = 0
        loginAttempts.set(ip, attempts)
        return false
    }

    return true
}

export function resetRateLimit(ip: string): void {
    loginAttempts.delete(ip)
}

// Security Headers
export function getSecurityHeaders() {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    }
}

// Audit Logging
export function logAuthEvent(event: string, details: { userId?: string; ip?: string; userAgent?: string; success: boolean }) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        ...details
    }

    // In production, this should write to a secure log file or database
    console.log('[AUTH_AUDIT]', JSON.stringify(logEntry))
}

// Environment Configuration
export function getAuthConfig() {
    return {
        sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
        passwordMinLength: 8,
        maxLoginAttempts: MAX_ATTEMPTS,
        lockoutDuration: LOCKOUT_DURATION,
        enableRateLimit: process.env.NODE_ENV === 'production',
        enableSecurityHeaders: true,
    }
}

// Error types and handling for better error mapping
export enum AuthErrorType {
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    NETWORK_ERROR = 'NETWORK_ERROR',
    SERVER_ERROR = 'SERVER_ERROR',
    RATE_LIMITED = 'RATE_LIMITED',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export interface AuthError extends Error {
    type: AuthErrorType
    status?: number
    userMessage: string
    details?: any
}

export class AuthenticationError extends Error implements AuthError {
    public type: AuthErrorType
    public status?: number
    public userMessage: string
    public details?: any

    constructor(type: AuthErrorType, message: string, userMessage: string, status?: number, details?: any) {
        super(message)
        this.name = 'AuthenticationError'
        this.type = type
        this.userMessage = userMessage
        this.status = status
        this.details = details
    }
}

// Map HTTP status codes and fetch errors to user-friendly messages
export function mapErrorToUserMessage(error: any): { message: string; type: AuthErrorType } {
    // Network/Connection errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
            message: 'Network issue — check your connection and try again',
            type: AuthErrorType.NETWORK_ERROR
        }
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return {
            message: 'Network issue — check your connection and try again',
            type: AuthErrorType.TIMEOUT_ERROR
        }
    }

    // HTTP Status-based errors
    if (error.status) {
        switch (error.status) {
            case 400:
            case 401:
                return {
                    message: 'Incorrect username or password',
                    type: AuthErrorType.INVALID_CREDENTIALS
                }
            case 429:
                return {
                    message: 'Too many login attempts. Please wait and try again',
                    type: AuthErrorType.RATE_LIMITED
                }
            case 500:
            case 502:
            case 503:
            case 504:
                return {
                    message: 'Server problem — please try again shortly',
                    type: AuthErrorType.SERVER_ERROR
                }
            default:
                if (error.status >= 500) {
                    return {
                        message: 'Server problem — please try again shortly',
                        type: AuthErrorType.SERVER_ERROR
                    }
                }
                break
        }
    }

    // Specific error messages from API
    if (typeof error.message === 'string') {
        const message = error.message.toLowerCase()

        if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
            return {
                message: 'Network issue — check your connection and try again',
                type: AuthErrorType.NETWORK_ERROR
            }
        }

        if (message.includes('invalid') || message.includes('incorrect') || message.includes('password') || message.includes('username')) {
            return {
                message: 'Incorrect username or password',
                type: AuthErrorType.INVALID_CREDENTIALS
            }
        }

        if (message.includes('server') || message.includes('internal')) {
            return {
                message: 'Server problem — please try again shortly',
                type: AuthErrorType.SERVER_ERROR
            }
        }
    }

    // Default fallback
    return {
        message: 'An unexpected error occurred. Please try again',
        type: AuthErrorType.SERVER_ERROR
    }
}

// Development logging utility (only logs in development)
export function logAuthError(message: string, context?: any) {
    if (process.env.NODE_ENV === 'development') {
        console.group(`🔐 Auth Error - ${message}`)
        if (context) {
            console.error('Context:', context)
        }
        console.groupEnd()
    }
}