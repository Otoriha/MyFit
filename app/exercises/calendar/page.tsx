'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

interface Exercise {
  id: string
  name: string
  duration: number
  calories: number
  date: string
}

export default function CalendarPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const router = useRouter()

  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ユーザーが見つかりません')

      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      setExercises(data)
    } catch (error) {
      console.error('Error fetching exercises:', error)
      toast({
        title: 'エラー',
        description: '運動記録の取得に失敗しました。',
        variant: 'destructive',
      })
    }
  }

  const getDayContent = (day: Date) => {
    const exercisesOnDay = exercises.filter(
      (exercise) => new Date(exercise.date).toDateString() === day.toDateString()
    )
    return exercisesOnDay.length > 0 ? (
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-red-500 rounded-b-md" />
    ) : null
  }

  const selectedExercises = exercises.filter(
    (exercise) => new Date(exercise.date).toDateString() === selectedDate.toDateString()
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="bg-sky-100">
            <CardTitle className="text-2xl font-bold text-center text-sky-800">運動カレンダー</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  className="rounded-md border"
                  getDayContent={getDayContent}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-4 text-sky-800">
                  {selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}の運動記録
                </h3>
                {selectedExercises.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedExercises.map((exercise) => (
                      <li key={exercise.id} className="border-b border-sky-200 pb-2">
                        <p className="font-medium text-sky-700">{exercise.name}</p>
                        <p className="text-sm text-sky-600">
                          時間: {exercise.duration}分, カロリー: {exercise.calories}kcal
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sky-600">この日の記録はありません。</p>
                )}
              </div>
            </div>
            <Button onClick={() => router.push('/dashboard')} className="mt-6 w-full bg-sky-500 hover:bg-sky-600 text-white">
              ダッシュボードに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}