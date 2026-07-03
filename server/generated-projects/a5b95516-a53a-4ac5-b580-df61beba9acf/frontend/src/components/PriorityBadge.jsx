import React from 'react'

function PriorityBadge({ priority }) {
  let colorClass = ''
  let text = ''

  switch (priority) {
    case 'low':
      colorClass = 'bg-blue-500/20 text-blue-400'
      text = 'Low'
      break
    case 'medium':
      colorClass = 'bg-yellow-500/20 text-yellow-400'
      text = 'Medium'
      break
    case 'high':
      colorClass = 'bg-red-500/20 text-red-400'
      text = 'High'
      break
    default:
      colorClass = 'bg-gray-500/20 text-gray-400'
      text = 'Unknown'
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {text}
    </span>
  )
}

export default PriorityBadge
