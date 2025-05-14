"use client"

import { useState } from "react"

function TestQuestion({ question, onAnswer }) {
  const [selectedOption, setSelectedOption] = useState(null)

  const handleOptionSelect = (optionId) => {
    setSelectedOption(optionId)
  }

  const handleSubmit = () => {
    if (selectedOption !== null) {
      onAnswer(question._id, selectedOption)
    }
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

      <button className="btn btn-primary" onClick={handleSubmit} disabled={selectedOption === null}>
        Confirmer
      </button>
    </div>
  )
}

export default TestQuestion
