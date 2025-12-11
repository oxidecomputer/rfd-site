/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

export const SortArrowTop = ({ className }: { className?: string }) => (
  <svg
    width="6"
    height="5"
    viewBox="0 0 6 5"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M2.67844 0.182052C2.82409 -0.0607001 3.17591 -0.0607005 3.32156 0.182052L5.65924 4.07818C5.80921 4.32813 5.62916 4.64612 5.33768 4.64612L0.66232 4.64612C0.370835 4.64612 0.190792 4.32813 0.34076 4.07818L2.67844 0.182052Z"
      fill="currentColor"
    />
  </svg>
)

export const SortArrowBottom = ({ className }: { className?: string }) => (
  <svg
    width="6"
    height="5"
    viewBox="0 0 6 5"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3.32156 4.46407C3.17591 4.70682 2.82409 4.70682 2.67844 4.46407L0.340763 0.567936C0.190795 0.31799 0.370837 3.67594e-09 0.662322 1.64172e-08L5.33768 2.20783e-07C5.62917 2.33525e-07 5.80921 0.31799 5.65924 0.567936L3.32156 4.46407Z"
      fill="currentColor"
    />
  </svg>
)

export const GotoIcon = ({ className }: { className?: string }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.53033 2.46967C7.23744 2.17678 6.76256 2.17678 6.46967 2.46967C6.17678 2.76256 6.17678 3.23744 6.46967 3.53033L8.18934 5.25H2C1.58579 5.25 1.25 5.58579 1.25 6V9C1.25 9.41421 1.58579 9.75 2 9.75C2.41421 9.75 2.75 9.41421 2.75 9V6.75H8.18934L6.46967 8.46967C6.17678 8.76256 6.17678 9.23744 6.46967 9.53033C6.76256 9.82322 7.23744 9.82322 7.53033 9.53033L10.5303 6.53033C10.8232 6.23744 10.8232 5.76256 10.5303 5.46967L7.53033 2.46967Z"
      fill="currentColor"
    />
  </svg>
)

export const SunIcon = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 1V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 13V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3 8H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12.95 3.05L11.54 4.46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4.46 11.54L3.05 12.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12.95 12.95L11.54 11.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4.46 4.46L3.05 3.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const MoonIcon = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M14.5 9.5C13.5 10.5 12 11 10.5 11C7 11 4 8 4 4.5C4 3 4.5 1.5 5.5 0.5C2.5 1.5 0.5 4.5 0.5 8C0.5 12.1 3.9 15.5 8 15.5C11.5 15.5 14.5 13.5 15.5 10.5C15.2 10.2 14.8 9.8 14.5 9.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
