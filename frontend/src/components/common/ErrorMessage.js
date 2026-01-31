import React from 'react';

function ErrorMessage({ message }) {
  return (
    <div style={{ color: 'red', marginTop: '10px' }}>
      {message}
    </div>
  );
}

export default ErrorMessage;
