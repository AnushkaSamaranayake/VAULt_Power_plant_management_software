import React from 'react'
import { BrowserRouter as Router } from 'react-router'
import {Routes, Route} from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Transformers from './pages/Transformers'

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transformers" element={<Transformers />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
