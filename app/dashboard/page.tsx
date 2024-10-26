'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Timer, Target } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

interface Exercise {
  id: number
  name: string
  duration: number
  calories: number
  date: string
}

interface Goal {
  id: string
  type: string
  target: number
  current: number
}

function RecentExerciseSummary({ exercises }: { exercises: Exercise[] }) {
  if (!exercises || exercises.length === 0) {
    return <p className="text-center text-sky-700">最近の運動記録はありません。</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>日付</TableHead>
          <TableHead>運動種目</TableHead>
          <TableHead>時間（分）</TableHead>
          <TableHead>消費カロリー</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exercises.map((exercise) => (
          <TableRow key={exercise.id}>
            <TableCell>{new Date(exercise.date).toLocaleDateString()}</TableCell>
            <TableCell>{exercise.name}</TableCell>
            <TableCell>{exercise.duration}</TableCell>
            <TableCell>{exercise.calories}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function GoalSettingModal({ isOpen, onClose, onSave, currentGoal }: { isOpen: boolean, onClose: () => void, onSave: (goal: Goal) => void, currentGoal: Goal | null }) {
  const [goalType, setGoalType] = useState(currentGoal?.type || '週間運動時間')
  const [goalTarget, setGoalTarget] = useState(currentGoal?.target.toString() || '')

  const handleSave = () => {
    onSave({
      id: currentGoal?.id || '',
      type: goalType,
      target: parseInt(goalTarget),
      current: currentGoal?.current || 0
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>目標設定</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="goalType" className="text-right">
              目標の種類
            </Label>
            <Input
              id="goalType"
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="goalTarget" className="text-right">
              目標値（分）
            </Label>
            <Input
              id="goalTarget"
              type="number"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function Dashboard() {
  const [user, setUser] = useState<{ id: string, name: string, email: string } | null>(null)
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([])
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser({
            id: user.id,
            name: user.user_metadata.name || '',
            email: user.email || '',
          })
          await fetchExercises(user.id)
          await fetchGoal(user.id)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast({
          title: 'エラー',
          description: 'ユーザーデータの取得に失敗しました。',
          variant: 'destructive',
        })
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const fetchExercises = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(5)

      if (error) throw error

      setRecentExercises(data)
    } catch (error) {
      console.error('Error fetching exercises:', error)
      toast({
        title: 'エラー',
        description: '運動記録の取得に失敗しました。',
        variant: 'destructive',
      })
    }
  }

  const fetchGoal = async (userId: string) => {
    try {
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (goalError) {
        if (goalError.code === 'PGRST116') {
          setGoal(null)
        } else {
          throw goalError
        }
      } else {
        // Fetch all exercises for the current week
        const startOfWeek = new Date()
        startOfWeek.setHours(0, 0, 0, 0)
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('duration')
          .eq('user_id', userId)
          .gte('date', startOfWeek.toISOString())

        if (exercisesError) throw exercisesError

        const totalDuration = exercisesData.reduce((sum, exercise) => sum + exercise.duration, 0)

        setGoal({
          ...goalData,
          current: totalDuration
        })
      }
    } catch (error) {
      console.error('Error fetching goal:', error)
      toast({
        title: 'エラー',
        description: '目標の取得に失敗しました。',
        variant: 'destructive',
      })
    }
  }

  const handleGoalUpdate = async (newGoal: Goal) => {
    try {
      if (newGoal.id) {
        const { error } = await supabase
          .from('goals')
          .update({ type: newGoal.type, target: newGoal.target })
          .eq('id', newGoal.id)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('goals')
          .insert([{ user_id: user?.id, type: newGoal.type, target: newGoal.target }])
          .select()

        if (error) throw error
        newGoal.id = data[0].id
      }

      await fetchGoal(user!.id)
      setIsGoalModalOpen(false)
      toast({
        title: '成功',
        description: '目標が更新されました。',
      })
    } catch (error) {
      console.error('Error updating goal:', error)
      toast({
        title: 'エラー',
        description: '目標の更新に失敗しました。',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-sky-50">読み込み中...</div>
  }

  if (!user) {
    return <div className="container mx-auto px-4 py-8 bg-sky-50">ユーザーが見つかりません。</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-sky-800">MyFit 一覧</h1>
          <div className="text-right">
            <p className="text-sm text-sky-600">ようこそ</p>
            <p className="font-semibold text-sky-800">{user.name}さん</p>
            <Button
              variant="link"
              className="text-sm text-sky-600 hover:underline p-0"
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
            >
              ログアウト
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-sky-100">
              <CardTitle className="flex items-center text-sky-800">
                <Timer className="mr-2 text-sky-600" />
                最近の運動記録
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentExerciseSummary exercises={recentExercises} />
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-sky-100">
              <CardTitle className="flex items-center text-sky-800">
                <Target className="mr-2 text-sky-600" />
                目標進捗
              </CardTitle>
            </CardHeader>
            <CardContent>
              {goal ? (
                <div>
                  <p className="mb-2 text-sky-700">{goal.type}: {goal.current}/{goal.target} 分</p>
                  <Progress value={(goal.current / goal.target) * 100} className="mb-4" />
                  <Button onClick={() => setIsGoalModalOpen(true)} className="w-full bg-sky-500 hover:bg-sky-600">
                    目標を更新
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsGoalModalOpen(true)} className="w-full bg-sky-500 hover:bg-sky-600">
                  目標を設定
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-sky-100">
              <CardTitle className="flex items-center text-sky-800">
                <Timer className="mr-2 text-sky-600" />
                運動を計測
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sky-700">新しい運動セッションを開始し、リアルタイムで記録します。</p>
              <Button asChild className="w-full bg-sky-500 hover:bg-sky-600">
                <Link href="/exercises/measure">計測を開始</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-sky-100">
              <CardTitle className="flex items-center text-sky-800">
                <CalendarDays className="mr-2 text-sky-600" />
                カレンダー
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sky-700">これまでの運動記録をカレンダーで確認します。</p>
              <Button asChild className="w-full bg-sky-500 hover:bg-sky-600">
                <Link href="/exercises/calendar">カレンダーを見る</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <GoalSettingModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleGoalUpdate}
        currentGoal={goal}
      />
    </div>
  )
}