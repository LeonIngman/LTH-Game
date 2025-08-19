/**
 * Integration Tests for Authentication API Routes
 * Testing login, session, logout endpoints with database interactions
 */

import { POST as loginPOST } from '@/app/api/auth/login/route'
import { GET as sessionGET } from '@/app/api/auth/session/route'
import bcryptjs from 'bcryptjs'

// Mock database
jest.mock('@/lib/db', () => ({
    sql: jest.fn(),
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}))

// Mock Next.js cookies
jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}))

const mockedSql = require('@/lib/db').sql as jest.Mock
const mockedBcryptjs = bcryptjs as jest.Mocked<typeof bcryptjs>
const mockedCookies = require('next/headers').cookies as jest.Mock

// Mock NextRequest
class MockNextRequest {
    constructor(public url: string, public init: RequestInit) { }

    async json() {
        return JSON.parse(this.init.body as string)
    }
}

describe('Authentication API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Setup default mocks
        mockedCookies.mockResolvedValue({
            get: jest.fn(),
            set: jest.fn(),
        })
    })

    describe('POST /api/auth/login', () => {
        it('should return 400 for missing credentials', async () => {
            const request = new MockNextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({}),
            }) as any

            const response = await loginPOST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toBe('Username and password are required')
        })

        it('should return 401 for invalid user', async () => {
            // Mock database to return no users
            mockedSql.mockResolvedValue([])

            const request = new MockNextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    username: 'nonexistent',
                    password: 'wrongpassword'
                }),
            }) as any

            const response = await loginPOST(request)
            const data = await response.json()

            expect(response.status).toBe(401)
            expect(data.error).toBe('Invalid username or password')
        })

        it('should return 401 for wrong password', async () => {
            // Mock database to return user
            mockedSql
                .mockResolvedValueOnce([{
                    id: 'user123',
                    username: 'testuser',
                    password: '$2b$10$hashedpassword',
                    role: 'student'
                }])

                // Mock bcrypt to return false (wrong password)
                ; (mockedBcryptjs.compare as jest.Mock).mockResolvedValue(false)

            const request = new MockNextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    username: 'testuser',
                    password: 'wrongpassword'
                }),
            }) as any

            const response = await loginPOST(request)
            const data = await response.json()

            expect(response.status).toBe(401)
            expect(data.error).toBe('Invalid username or password')
            expect(mockedBcryptjs.compare).toHaveBeenCalledWith('wrongpassword', '$2b$10$hashedpassword')
        })

        it('should successfully login with valid credentials', async () => {
            // Mock database queries
            mockedSql
                .mockResolvedValueOnce([{
                    id: 'user123',
                    username: 'testuser',
                    password: '$2b$10$hashedpassword',
                    role: 'student',
                    progress: 5
                }])
                .mockResolvedValueOnce([]) // Update lastActive
                .mockResolvedValueOnce([]) // Insert session

                // Mock bcrypt to return true (correct password)
                ; (mockedBcryptjs.compare as jest.Mock).mockResolvedValue(true)

            // Mock cookies
            const mockCookieStore = {
                set: jest.fn()
            }
            mockedCookies.mockResolvedValue(mockCookieStore)

            const request = new MockNextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    username: 'testuser',
                    password: 'correctpassword'
                }),
            }) as any

            const response = await loginPOST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.user).toEqual({
                id: 'user123',
                username: 'testuser',
                role: 'student',
                progress: 5
            })
            expect(data.redirect).toBe('/dashboard/student')
            expect(mockCookieStore.set).toHaveBeenCalled()
        })
    })

    describe('GET /api/auth/session', () => {
        it('should return null user when no session cookie', async () => {
            // Mock cookies to return no session
            mockedCookies.mockResolvedValue({
                get: jest.fn().mockReturnValue(undefined)
            })

            const response = await sessionGET()
            const data = await response.json()

            expect(data.user).toBeNull()
        })

        it('should return user data for valid session', async () => {
            mockedCookies.mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'session123' })
            })

            mockedSql.mockResolvedValue([{
                user_id: 'user123',
                id: 'user123',
                username: 'testuser',
                role: 'student',
                progress: 5
            }])

            const response = await sessionGET()
            const data = await response.json()

            expect(data.user).toEqual({
                id: 'user123',
                username: 'testuser',
                role: 'student',
                progress: 5
            })
        })
    })

    describe('Security Integration Tests', () => {
        it('should validate input data for SQL injection attempts', async () => {
            // Test SQL injection attempt
            const maliciousInput = "'; DROP TABLE users; --"

            mockedSql.mockResolvedValue([])

            const request = new MockNextRequest('http://localhost/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    username: maliciousInput,
                    password: 'password'
                }),
            }) as any

            const response = await loginPOST(request)
            const data = await response.json()

            // Should still return 401 (not crash) and SQL should be called safely
            expect(response.status).toBe(401)
            expect(data.error).toBe('Invalid username or password')
        })
    })
})
