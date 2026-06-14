import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HalamanDaftar from './pages/HalamanDaftar.jsx'
import HalamanDetail from './pages/HalamanDetail.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 font-sans">
      <Routes>
        <Route path="/" element={<HalamanDaftar />} />
        <Route path="/saham/:kode" element={<HalamanDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
