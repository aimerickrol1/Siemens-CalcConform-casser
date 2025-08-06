import React from 'react';
import { View, ViewStyle } from 'react-native';

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export function AnimatedCard({ 
  children, 
  delay = 0, 
  duration = 300, 
  style 
}: AnimatedCardProps) {
  // Version simplifiée sans animation pour garantir la compatibilité
  return (
    <View style={style}>
      {children}
    </View>
  );
}

interface AnimatedListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  duration?: number;
  style?: ViewStyle;
}

export function AnimatedList({ 
  children, 
  staggerDelay = 100, 
  duration = 300, 
  style 
}: AnimatedListProps) {
  return (
    <>
      {children.map((child, index) => (
        <AnimatedCard
          key={index}
          duration={duration}
          style={style}
        >
          {child}
        </AnimatedCard>
      ))}
    </>
  );
}

interface FadeInViewProps {
  children: React.ReactNode;
  visible: boolean;
  duration?: number;
  style?: ViewStyle;
}

export function FadeInView({ 
  children, 
  visible, 
  duration = 300, 
  style 
}: FadeInViewProps) {
  return (
    <View style={[{ opacity: visible ? 1 : 0 }, style]}>
      {children}
    </View>
  );
}