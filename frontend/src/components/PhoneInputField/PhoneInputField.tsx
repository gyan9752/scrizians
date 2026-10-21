'use client';

import React, { useEffect, useState } from 'react';
import PhoneInput from 'react-phone-input-2';

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  variant?: 'default' | 'underline';
  className?: string;
  inputStyle?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
}

export const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  value,
  onChange,
  placeholder = '98765 43210',
  required = false,
  variant = 'default',
  inputStyle,
  buttonStyle,
}) => {
  const [mounted, setMounted] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isUnderline = variant === 'underline';

  if (!mounted) {
    return (
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={
          isUnderline
            ? {
                width: '100%',
                padding: '0.55rem 0',
                border: 'none',
                borderBottom: '2px solid #E2E8F0',
                fontSize: '0.92rem',
                color: '#0F172A',
                fontWeight: 600,
                outline: 'none',
                background: 'transparent',
                boxSizing: 'border-box',
                ...inputStyle,
              }
            : {
                width: '100%',
                height: '42px',
                padding: '0.65rem 0.75rem',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                outline: 'none',
                ...inputStyle,
              }
        }
      />
    );
  }

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        ...(isUnderline
          ? {
              borderBottom: focused ? '2px solid #E52B2B' : '2px solid #E2E8F0',
              transition: 'border-color 0.2s ease',
              paddingBottom: '2px',
            }
          : {}),
      }}
    >
      <PhoneInput
        country={'in'}
        value={value}
        onChange={(phoneVal, countryData, e, formattedValue) => {
          onChange(formattedValue || phoneVal);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        enableSearch={true}
        searchPlaceholder="Search country..."
        searchNotFound="No country found"
        placeholder={placeholder}
        inputProps={{
          required: required,
          name: 'phone',
          ariaLabel: 'Phone number input',
        }}
        inputStyle={
          isUnderline
            ? {
                width: '100%',
                height: '36px',
                fontSize: '0.92rem',
                fontWeight: 600,
                borderRadius: '0px',
                border: 'none',
                paddingLeft: '48px',
                background: 'transparent',
                color: '#0F172A',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                outline: 'none',
                boxShadow: 'none',
                ...inputStyle,
              }
            : {
                width: '100%',
                height: '42px',
                fontSize: '0.9rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                paddingLeft: '48px',
                background: '#ffffff',
                color: '#0F172A',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                ...inputStyle,
              }
        }
        buttonStyle={
          isUnderline
            ? {
                borderRadius: '0px',
                border: 'none',
                background: 'transparent',
                padding: '0 2px',
                height: '36px',
                ...buttonStyle,
              }
            : {
                borderRadius: '6px 0 0 6px',
                border: '1px solid #CBD5E1',
                borderRight: 'none',
                background: '#F8FAFC',
                padding: '0 4px',
                ...buttonStyle,
              }
        }
        dropdownStyle={{
          width: '310px',
          fontSize: '0.85rem',
          color: '#0F172A',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
          zIndex: 9999,
        }}
        containerStyle={{
          width: '100%',
        }}
      />
    </div>
  );
};
