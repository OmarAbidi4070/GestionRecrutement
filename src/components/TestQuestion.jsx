"use client"

import { useState, useEffect } from "react"

function TestQuestion({ question, onAnswer, selectedAnswer }) {
  const [selectedOption, setSelectedOption] = useState(selectedAnswer || "")

  useEffect(() => {
    setSelectedOption(selectedAnswer || "")
  }, [selectedAnswer, question._id])

  const handleOptionSelect = (optionId) => {
    setSelectedOption(optionId)
    onAnswer(question._id, optionId)
  }

  return (
    <div className="test-question card">
      <h3>{question.text}</h3>

      <div className="options-list">
        {question.options.map((option) => (
          <div
            key={option._id}
            className={`option ${selectedOption === option._id ? "selected" : ""}`}
            onClick={() => handleOptionSelect(option._id)}
          >
            <input
              type="radio"
              id={`option-${option._id}`}
              name={`question-${question._id}`}
              checked={selectedOption === option._id}
              onChange={() => handleOptionSelect(option._id)}
            />
            <label htmlFor={`option-${option._id}`}>{option.text}</label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TestQuestion
