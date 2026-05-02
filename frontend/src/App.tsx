import './App.css'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'
import { Outlet } from '@tanstack/react-router'

function App() {
  return (
    <>
      <header>
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
      <Outlet />
    </>
  )
}

export default App
