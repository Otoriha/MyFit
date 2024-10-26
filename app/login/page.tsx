'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast({ title: 'ログイン成功', description: 'ダッシュボードにリダイレクトします。' })
      router.push('/dashboard')
    } catch (error) {
      console.error('ログインエラー:', error)
      toast({ title: 'ログイン失敗', description: 'メールアドレスまたはパスワードが正しくありません。', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-100 to-white">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>MyFitLogにログインしてください。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button className="w-full mt-4" type="submit" disabled={isLoading}>
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない方は
            <Link href="/signup" className="text-sky-600 hover:underline">
              こちら
            </Link>
            から新規登録
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}