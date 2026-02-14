import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

function SkeletonItem({ width, height = 16, borderRadius = 8 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width: width ?? '100%',
        height,
        borderRadius,
        backgroundColor: '#363636',
        opacity,
      }}
    />
  );
}

export function NewsCardSkeleton() {
  return (
    <View className="bg-card rounded-2xl p-4 mb-3 mx-4">
      <View className="flex-row items-center gap-2 mb-3">
        <SkeletonItem width={60} height={20} borderRadius={10} />
        <SkeletonItem width={80} height={14} borderRadius={6} />
      </View>
      <SkeletonItem height={20} borderRadius={6} />
      <View className="mt-2">
        <SkeletonItem height={14} borderRadius={6} />
        <View className="mt-1">
          <SkeletonItem width="70%" height={14} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

export function SnapCardSkeleton() {
  return (
    <View className="bg-card rounded-2xl p-4 mb-3 mx-4">
      <View className="flex-row items-center justify-between mb-3">
        <SkeletonItem width={80} height={20} borderRadius={10} />
        <SkeletonItem width={60} height={14} borderRadius={6} />
      </View>
      <SkeletonItem height={22} borderRadius={6} />
      <View className="mt-3">
        <SkeletonItem height={14} borderRadius={6} />
        <View className="mt-1">
          <SkeletonItem height={14} borderRadius={6} />
        </View>
        <View className="mt-1">
          <SkeletonItem width="60%" height={14} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

export function IdeaCardSkeleton() {
  return (
    <View className="bg-card rounded-2xl p-4 mb-3 mx-4">
      <SkeletonItem height={22} borderRadius={6} />
      <View className="mt-2">
        <SkeletonItem height={14} borderRadius={6} />
        <View className="mt-1">
          <SkeletonItem height={14} borderRadius={6} />
        </View>
      </View>
      <View className="flex-row gap-3 mt-3">
        {[0, 1, 2].map((i) => (
          <View key={i} className="flex-1">
            <SkeletonItem height={12} borderRadius={4} />
            <View className="mt-1">
              <SkeletonItem height={8} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default SkeletonItem;
