import type { ComponentProps, Ref } from 'react';

export function formatPhone(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (input.trim().startsWith('+7') || (digits.length > 10 && /^[78]/.test(digits))) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)].filter(Boolean);
  return '+7' + (groups.length ? '-' + groups.join('-') : '');
}

type Props = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'ref'> & {
  value: string;
  onChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};

export function PhoneInput({ value, onChange, ...props }: Props) {
  function update(input: HTMLInputElement, raw: string, caret: number) {
    const formatted = formatPhone(raw);
    const beforeCaret = formatPhone(raw.slice(0, caret)).replace(/\D/g, '').length;
    let position = 2;
    let count = 1;
    while (position < formatted.length && count < beforeCaret) {
      if (/\d/.test(formatted[position])) count++;
      position++;
    }
    // Set the DOM value too, so ignored characters keep the caret in place.
    input.value = formatted;
    onChange(formatted);
    input.setSelectionRange(position, position);
  }

  return <input {...props} type="tel" inputMode="tel" autoComplete="tel" value={value}
    onChange={event => update(event.currentTarget, event.currentTarget.value, event.currentTarget.selectionStart ?? event.currentTarget.value.length)}
    onPaste={event => {
      event.preventDefault();
      const input = event.currentTarget;
      const pasted = event.clipboardData.getData('text');
      const start = Math.max(2, input.selectionStart ?? value.length);
      const end = Math.max(start, input.selectionEnd ?? start);
      // Full numbers from contacts may include spaces, brackets or the 8 prefix.
      if (/^\s*\+7/.test(pasted) || /^[78]\d{10}$/.test(pasted.replace(/\D/g, ''))) {
        const formatted = formatPhone(pasted);
        update(input, formatted, formatted.length);
      } else {
        const digits = pasted.replace(/\D/g, '');
        update(input, value.slice(0, start) + digits + value.slice(end), start + digits.length);
      }
    }}
    onKeyDown={event => {
      const input = event.currentTarget;
      let start = Math.max(2, input.selectionStart ?? value.length);
      let end = Math.max(start, input.selectionEnd ?? start);
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        if (start === end) {
          if (event.key === 'Backspace') {
            while (start > 2 && !/\d/.test(value[start - 1])) start--;
            if (start > 2) start--;
          } else {
            while (end < value.length && !/\d/.test(value[end])) end++;
            if (end < value.length) end++;
          }
        }
        update(input, value.slice(0, start) + value.slice(end), start);
      } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (!/\d/.test(event.key)) event.preventDefault();
        else input.setSelectionRange(start, end);
      }
    }}
  />;
}
