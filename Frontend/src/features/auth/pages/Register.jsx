import React, { useState } from 'react'
import "../style/register.scss"
import FormGroup from '../components/FormGroup'
import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router'

const Register = () => {

    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const navigate = useNavigate()
    const { loading, handleRegister } = useAuth()

    async function handleSubmit(e) {
        e.preventDefault()
        await handleRegister({ username, password, email })
        navigate('/')
    }

    return (
        <main className="auth-page">
            <div className="auth-card">

                <div className="auth-card__brand">
                    <span className="brand-icon">🎵</span>
                    <span className="brand-name">Mood<span>ify</span></span>
                </div>

                <h1 className="auth-card__heading">Create account</h1>
                <p className="auth-card__subheading">Join Moodify and discover music for every mood</p>

                <form onSubmit={handleSubmit}>
                    <FormGroup
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        label="Name"
                        placeholder="Your name"
                        type="text"
                    />
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
                        placeholder="Create a password"
                        type="password"
                    />
                    <button className="auth-btn" type="submit" disabled={loading}>
                        {loading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-card__footer">
                    <p>Already have an account? <Link to="/login">Sign in</Link></p>
                </div>

            </div>
        </main>
    )
}

export default Register
