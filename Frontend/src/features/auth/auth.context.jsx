import { createContext, useEffect, useRef, useState } from "react";
import { getMe } from "./services/auth.api";

export const AuthContext = createContext()


export const AuthProvider = ({ children }) => {

    const [ user, setUser ] = useState(null)
    const [ loading, setLoading ] = useState(true)
    const didInitRef = useRef(false)

    useEffect(() => {
        if (didInitRef.current) return
        didInitRef.current = true

        const fetchMe = async () => {
            setLoading(true)
            try {
                const { user: me } = await getMe()
                setUser(me)
            } catch {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        fetchMe()
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading }} >
            {children}
        </AuthContext.Provider>
    )

}
