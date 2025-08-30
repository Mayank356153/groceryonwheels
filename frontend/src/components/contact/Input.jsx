import React from "react";
import { useId } from 'react'; // Importing useId hook for generating unique IDs

export default function Input({
  id=" ",
  type = "text", // Default input type is "text"
  label_class = "", // Class for the label, default is an empty string
  label, // Label text for the input
  className = "", // Class for the input element, default is an empty string
  placeholder = "", // Placeholder text for the input
  div_class = "", // Class for the div container, default is an empty string
  ...props // Spread operator to capture any additional props
}) {
  const ID = useId(); // Generate a unique ID for the input element

  return (
    <div className={div_class}> {/* Container div for the input and label */}
      {label ? <label className={label_class} htmlFor={id===" "?ID:id}>{label}</label> : null} {/* Render label if provided */}
      <input 
        type={type} // Set the input type
        id={id===" "?ID:id} // Set the unique ID for the input
        placeholder={placeholder} // Set the placeholder text
        className={className} // Set the input class
        {...props} // Spread any additional props onto the input element
      />
    </div>
  );
}