'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { UserRole } from '@/app/dashboard/users/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Kullanıcı tipini tanımlama
export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  branchId?: string | null
  phone?: string | null
  commissionRate?: number | null
  status?: string
}

// Auth Context tipleri
interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

// Default context değeri
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()

  // Oturum açma
  const login = async (email: string, password: string) => {
    try {
      const { data } = await axios.post(`${BASE_URL}/auth/login`, {
        email,
        password,
      })

      setUser(data.user)
      
      // Token'ı storage'a kaydet
      localStorage.setItem('accessToken', data.accessToken)
      
      // Axios varsayılan başlıklarını ayarla
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
      
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Oturumu kapatma
  const logout = async () => {
    try {
      // API'yi çağır
      await axios.post(`${BASE_URL}/auth/logout`)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Local storage'dan token'ı sil
      localStorage.removeItem('accessToken')
      
      // Axios başlıklarını temizle
      delete axios.defaults.headers.common['Authorization']
      
      // User state'ini sıfırla
      setUser(null)
      
      // Login sayfasına yönlendir
      router.push('/login')
    }
  }

  // Auth durumunu kontrol et
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      try {
        // Local storage'dan token'ı al
        const token = localStorage.getItem('accessToken')
        
        if (!token) {
          setIsLoading(false)
          return
        }
        
        // Token'ı Axios varsayılanlarına ekle
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // Kullanıcı bilgilerini al
        const { data } = await axios.get(`${BASE_URL}/auth/me`)
        setUser(data)
      } catch (error) {
        console.error('Auth check error:', error)
        // Hata durumunda token'ı sil
        localStorage.removeItem('accessToken')
        delete axios.defaults.headers.common['Authorization']
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Auth hook'u
export const useAuth = () => {
  return useContext(AuthContext)
}
