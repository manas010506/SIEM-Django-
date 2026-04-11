import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const AnimatedCounter = ({ 
  value, 
  duration = 2, 
  prefix = '', 
  suffix = '', 
  className = '' 
}) => {
  const counterRef = useRef(null);

  useEffect(() => {
    if (counterRef.current) {
      // Create a dummy object to animate its value property
      const target = { val: 0 };
      
      // Parse the incoming value (remove commas if it's a string)
      const numericValue = typeof value === 'string' 
        ? parseFloat(value.replace(/,/g, ''))
        : value;

      gsap.to(target, {
        val: numericValue,
        duration: duration,
        ease: 'power3.out',
        onUpdate: () => {
          if (counterRef.current) {
            // Format with commas and add prefix/suffix
            const formattedValue = Math.floor(target.val).toLocaleString();
            counterRef.current.innerText = `${prefix}${formattedValue}${suffix}`;
          }
        }
      });
    }
  }, [value, duration, prefix, suffix]);

  return <span ref={counterRef} className={className}>0</span>;
};

export default AnimatedCounter;
