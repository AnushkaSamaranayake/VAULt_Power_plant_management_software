import React from 'react'
import { BrowserRouter as Router } from 'react-router'
import {Routes, Route} from 'react-router-dom'
import Dashboard from './pages/Dashboard'

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
