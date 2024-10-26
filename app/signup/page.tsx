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

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      })
      if (error) throw error
      toast({ title: '新規登録成功', description: '確認メールを送信しました。メールを確認してアカウントを有効化してください。' })
      router.push('/login')
    } catch (error) {
      console.error('新規登録エラー:', error)
      toast({ title: '新規登録失敗', description: 'アカウントの作成に失敗しました。もう一度お試しください。', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-100 to-white">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>新規登録</CardTitle>
          <CardDescription>MyFitLogの新規アカウントを作成します。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  placeholder="山田 太郎"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
              {isLoading ? '登録中...' : '新規登録'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            すでにアカウントをお持ちの方は
            <Link href="/login" className="text-sky-600 hover:underline">
              こちら
            </Link>
            からログイン
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}