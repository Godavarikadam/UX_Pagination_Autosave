import React from 'react';

function SaveStatus({ status }) {
  let color = 'gray';
  if (status === 'Saving...') color = 'orange';
  if (status === 'Saved') color = 'green';
  if (status === 'Error') color = 'red';

  return <span style={{ color }}>{status}</span>;
}

export default SaveStatus;
