import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HalamanDaftar from './pages/HalamanDaftar.jsx'
import HalamanDetail from './pages/HalamanDetail.jsx'
import NavBar from './components/NavBar.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-screen-2xl">
        <Routes>
          <Route path="/" element={<HalamanDaftar />} />
          <Route path="/saham/:kode" element={<HalamanDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
