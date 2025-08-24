import React from 'react'
import { BrowserRouter as Router } from 'react-router'
import {Routes, Route} from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Transformers from './pages/Transformers'
import TransformerDetails from './pages/TransformerDetails'
import Settings from './pages/Settings'
import SideBar from './components/Dashboard/SideBar'
import AccountBar from './components/AccountBar'

const App = () => {
  return (
    <div className="flex">
      <Router>
        <SideBar />
        <AccountBar />
        <div className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transformers" element={<Transformers />} />
            <Route path="/transformers/:id" element={<TransformerDetails />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </Router>
    </div>
  )
}

export default App
