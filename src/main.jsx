import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import PublicHome from './public/Home'
import VideoDetail from './public/VideoDetail'
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <PublicHome /> },
  { path: '/v/:fileId', element: <VideoDetail /> },
  { path: '/admin', element: <App /> },
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
