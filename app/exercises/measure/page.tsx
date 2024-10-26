'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

const exerciseTypes = [
  { name: 'ウォーキング（ゆっくり）', met: 2.5 },
  { name: 'ウォーキング（普通）', met: 3.5 },
  { name: 'ジョギング', met: 7.0 },
  { name: 'ランニング', met: 9.0 },
  { name: '自転車（ゆっくり）', met: 4.0 },
  { name: '自転車（普通）', met: 6.0 },
  { name: '水泳', met: 6.0 },
  { name: 'ヨガ', met: 3.0 },
  { name: '筋力トレーニング', met: 3.5 },
]

export default function MeasurePage() {
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [selectedExercise, setSelectedExercise] = useState(exerciseTypes[0])
  const [calories, setCalories] = useState(0)
  const router = useRouter()

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 10)
      }, 10)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  useEffect(() => {
    const weight = 70 // kg
    const hours = time / 3600000 // ミリ秒から時間に変換
    const calculatedCalories = Math.round(selectedExercise.met * weight * hours)
    setCalories(calculatedCalories)
  }, [time, selectedExercise])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60000)
    const seconds = Math.floor((time % 60000) / 1000)
    const milliseconds = Math.floor((time % 1000) / 10)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }

  const handleStart = () => setIsRunning(true)
  const handleStop = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setTime(0)
  }

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ユーザーが見つかりません')

      const { error } = await supabase.from('exercises').insert({
        user_id: user.id,
        name: selectedExercise.name,
        duration: Math.floor(time / 60000), // ミリ秒から分に変換
        calories: calories,
        date: new Date().toISOString().split('T')[0],
      })

      if (error) throw error

      toast({
        title: '成功',
        description: '運動記録が保存されました。',
      })
      handleReset()
    } catch (error) {
      console.error('Error saving exercise:', error)
      toast({
        title: 'エラー',
        description: '運動記録の保存に失敗しました。',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="bg-sky-100">
            <CardTitle className="text-2xl font-bold text-center text-sky-800">運動計測</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-4xl font-mono text-center mb-6 text-sky-700">{formatTime(time)}</div>
            <div className="space-y-4">
              <div className="flex justify-center space-x-4">
                <Button onClick={handleStart} disabled={isRunning} className="bg-sky-500 hover:bg-sky-600">スタート</Button>
                <Button onClick={handleStop} disabled={!isRunning} className="bg-sky-500 hover:bg-sky-600">ストップ</Button>
                <Button onClick={handleReset} className="bg-sky-500 hover:bg-sky-600">リセット</Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exerciseType" className="text-sky-700">運動の種類</Label>
                <select
                  id="exerciseType"
                  value={selectedExercise.name}
                  onChange={(e) => setSelectedExercise(exerciseTypes.find(ex => ex.name === e.target.value) || exerciseTypes[0])}
                  className="w-full p-2 border border-sky-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  {exerciseTypes.map((exercise) => (
                    <option key={exercise.name} value={exercise.name}>
                      {exercise.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories" className="text-sky-700">消費カロリー</Label>
                <Input
                  id="calories"
                  type="number"
                  value={calories}
                  readOnly
                  className="border-sky-200 focus:border-sky-500"
                />
              </div>
              <Button onClick={handleSave} className="w-full bg-sky-500 hover:bg-sky-600">記録を保存</Button>
              <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full border-sky-500 text-sky-700 hover:bg-sky-50">
                ダッシュボードに戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}