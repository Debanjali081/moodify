import { login, register, getMe, logout } from "../services/auth.api";
import { useCallback, useContext, useMemo } from "react";
import { AuthContext } from "../auth.context";


export const useAuth = () => {
    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    async function handleRegister({ username, email, password }) {
        setLoading(true)
        const { user: registeredUser } = await register({ username, email, password })
        setUser(registeredUser)
        setLoading(false)
    }

    async function handleLogin({ username, email, password }) {
        setLoading(true)
        const { user: loggedInUser } = await login({ username, email, password })
        setUser(loggedInUser)
        setLoading(false)
    }

    const handleGetMe = useCallback(async () => {
        setLoading(true)
        try {
            const { user: me } = await getMe()
            setUser(me)
        } catch {
            // If fetching the current user fails (e.g. server down / unauthenticated),
            // ensure loading state is cleared so the UI doesn't stay stuck.
            setUser(null)
        } finally {
            setLoading(false)
        }
    }, [])

    const handleLogout = useCallback(async () => {
        setLoading(true)
        await logout()
        setUser(null)
        setLoading(false)
    }, [])

    return useMemo(() => ({
        user, loading, handleRegister, handleLogin, handleLogout, handleGetMe
    }), [user, loading, handleRegister, handleLogin, handleLogout, handleGetMe])
}
