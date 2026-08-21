import React from 'react';
import './App.css';

const SkeletonLoader = ({ type = 'line', count = 1 }) => {
  const skeletons = [];
  for (let i = 0; i < count; i++) {
    skeletons.push(<div key={i} className={`skeleton ${type}`}></div>);
  }
  return <>{skeletons}</>;
};

export default SkeletonLoader;