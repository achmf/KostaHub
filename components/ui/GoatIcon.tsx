import React from 'react';
import { GiGoat } from 'react-icons/gi';

export const GoatIcon = ({ size = 24, className = '' }: { size?: number, className?: string }) => (
  <GiGoat size={size} className={className} />
);
