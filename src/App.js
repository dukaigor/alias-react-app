'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function AliasGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [teams, setTeams] = useState(['', '', ''])
  const [currentTeam, setCurrentTeam] = useState(0)
  const [currentWord, setCurrentWord] = useState('')
  const [words, setWords] = useState<string[]>([])
  const [skippedWords, setSkippedWords] = useState<string[]>([])
  const [scores, setScores] = useState([0, 0, 0])
  const [timeLeft, setTimeLeft] = useState(60)
  const [isRoundActive, setIsRoundActive] = useState(false)
  const [roundScore, setRoundScore] = useState(0)
  const [showNextRoundButton, setShowNextRoundButton] = useState(false)
  const [showScore, setShowScore] = useState(false)
  const [lastWordHandled, setLastWordHandled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const savedState = localStorage.getItem('aliasGameState')
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      setTeams(parsedState.teams)
      setWords(parsedState.words)
      setScores(parsedState.scores)
    }
  }, [])

  useEffect(() => {
    if (isRoundActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      if (timeLeft <= 3 && audioRef.current) {
        audioRef.current.play()
      }
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      endRound()
    }
  }, [isRoundActive, timeLeft])

  useEffect(() => {
    if (gameStarted) {
      saveGameState()
    }
  }, [teams, words, scores])

  const saveGameState = () => {
    const gameState = {
      teams,
      words,
      scores
    }
    localStorage.setItem('aliasGameState', JSON.stringify(gameState))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setWords(content.split('\n').filter(word => word.trim() !== ''))
      }
      reader.readAsText(file)
    }
  }

  const startGame = () => {
    if (words.length > 0 && teams.every(team => team.trim() !== '')) {
      setGameStarted(true)
      startRound()
    } else {
      alert('Vă rugăm să încărcați cuvintele și să numiți toate echipele înainte de a începe jocul.')
    }
  }

  const startRound = () => {
    setTimeLeft(60)
    setIsRoundActive(true)
    setRoundScore(0)
    setShowNextRoundButton(false)
    setShowScore(false)
    setLastWordHandled(false)
    nextWord()
  }

  const endRound = () => {
    setIsRoundActive(false)
  }

  const nextWord = () => {
    const availableWords = words.filter(word => !skippedWords.includes(word))
    if (availableWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableWords.length)
      setCurrentWord(availableWords[randomIndex].toUpperCase())
    } else {
      endGame()
    }
  }

  const handleGuess = () => {
    setScores(prevScores => {
      const newScores = [...prevScores]
      newScores[currentTeam]++
      return newScores
    })
    setRoundScore(prevScore => prevScore + 1)
    if (timeLeft > 0) {
      nextWord()
    } else {
      setShowScore(true)
      setLastWordHandled(true)
      setShowNextRoundButton(true)
    }
  }

  const handleSkip = () => {
    setSkippedWords(prev => [...prev, currentWord])
    if (timeLeft > 0) {
      nextWord()
    } else {
      setShowScore(true)
      setLastWordHandled(true)
      setShowNextRoundButton(true)
    }
  }

  const nextTeam = () => {
    setCurrentTeam((prevTeam) => (prevTeam + 1) % 3)
    if (words.length > skippedWords.length) {
      startRound()
    } else {
      endGame()
    }
  }

  const endGame = () => {
    setGameStarted(false)
    setIsRoundActive(false)
    alert(`Jocul s-a terminat! Scor final:\n${teams.map((team, index) => `${team}: ${scores[index]}`).join('\n')}`)
  }

  const getTimeBarColor = () => {
    const greenValue = Math.floor((timeLeft / 60) * 255)
    const redValue = 255 - greenValue
    return `rgb(${redValue}, ${greenValue}, 0)`
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <AnimatePresence mode="wait">
          {!gameStarted ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="mb-4"
              />
              {teams.map((team, index) => (
                <Input
                  key={index}
                  value={team}
                  onChange={(e) => setTeams(prev => {
                    const newTeams = [...prev]
                    newTeams[index] = e.target.value
                    return newTeams
                  })}
                  placeholder={`Numele echipei ${index + 1}`}
                  className="mb-2"
                />
              ))}
              <Button onClick={startGame} className="w-full mt-4">Începe Jocul</Button>
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">{teams[currentTeam].toUpperCase()}</h3>
                <motion.p
                  key={currentWord}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-4xl font-bold mt-2"
                >
                  {showScore ? `${teams[currentTeam].toUpperCase()}: ${roundScore} PUNCTE` : currentWord}
                </motion.p>
              </div>
              <div 
                className="w-full h-2 mb-4 rounded-full overflow-hidden"
                style={{ backgroundColor: '#e0e0e0' }}
              >
                <div 
                  className="h-full transition-all duration-1000 ease-linear"
                  style={{ 
                    width: `${(timeLeft / 60) * 100}%`,
                    backgroundColor: getTimeBarColor()
                  }}
                />
              </div>
              {(isRoundActive || (!isRoundActive && !lastWordHandled)) && (
                <div className="flex justify-between mb-4 gap-4">
                  <Button onClick={handleGuess} className="flex-1 bg-green-500 hover:bg-green-600">Ghicit</Button>
                  <Button onClick={handleSkip} variant="outline" className="flex-1">Omite</Button>
                </div>
              )}
              {showNextRoundButton && (
                <Button onClick={nextTeam} className="w-full">Următoarea Rundă</Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      <audio ref={audioRef} src="/path-to-your-sound-file.mp3" />
    </Card>
  )
}
