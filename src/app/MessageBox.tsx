/**
 * MessageBox — Ink-idiomatic replacement for cbonsai's `createMessageWindows` /
 * `drawMessage`. The original hand-drew +/-/| border characters into the ncurses
 * panel; here Ink's <Box borderStyle> handles the border so this component stays
 * purely declarative.
 */
import React from 'react';
import { Box, Text } from 'ink';

interface MessageBoxProps { message: string; }

export default function MessageBox({ message }: MessageBoxProps): React.ReactElement | null {
  if (!message.trim()) return null;

  return (
    <Box borderStyle="round" paddingX={1} width={40}>
      <Text bold wrap="wrap">{message}</Text>
    </Box>
  );
}
