import React, { useState } from 'react'
import "../style/login.scss"
import FormGroup from '../components/FormGroup'
import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router'

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    async function handleSubmit(e) {
        e.preventDefault()
        await handleLogin({ email, password })
        navigate("/")
    }

    return (
        <main className="auth-page">
            <div className="auth-card">

                <div className="auth-card__brand">
                    <span className="brand-icon">🎵</span>
                    <span className="brand-name">Mood<span>ify</span></span>
                </div>

                <h1 className="auth-card__heading">Welcome back</h1>
                <p className="auth-card__subheading">Sign in to continue listening</p>

                <form onSubmit={handleSubmit}>
                    <FormGroup
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        label="Email"
                        placeholder="you@example.com"
                        type="email"
                    />
                    <FormGroup
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        label="Password"
                        placeholder="Enter your password"
                        type="password"
                    />
                    <button className="auth-btn" type="submit" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-card__footer">
                    <p>Don't have an account? <Link to="/register">Register here</Link></p>
                </div>

            </div>
        </main>
    )
}

export default Login
