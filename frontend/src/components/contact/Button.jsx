import React from 'react'

export default function Button({
    text,
    type="button",
    className,
    ...props
}) {
  return (
    <button  className={`${className}`} {...props}>{text}</button>
  )
}
