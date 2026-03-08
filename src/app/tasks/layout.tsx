import React from 'react'

export default function TasksLayout(props: { [key: string]: React.ReactNode }) {
  return (
    <>
      {props.children}
      {props.modal}
    </>
  )
}
