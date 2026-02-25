import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { Colors } from '@/lib/colors';

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

function SkeletonItem({ width, height = 16, borderRadius = 8 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width: width ?? '100%',
        height,
        borderRadius,
        backgroundColor: Colors.border,
        opacity,
      }}
    />
  );
}

export function NewsCardSkeleton() {
  return (
    <View
      className="bg-card rounded-2xl p-4 mb-3 mx-4"
      style={{
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      }}
    >
      <View className="flex-row items-center gap-2 mb-3">
        <SkeletonItem width={60} height={20} borderRadius={10} />
        <SkeletonItem width={80} height={14} borderRadius={6} />
      </View>
      <SkeletonItem height={20} borderRadius={6} />
      <View className="mt-2">
        <SkeletonItem height={14} borderRadius={6} />
        <View className="mt-1.5">
          <SkeletonItem width="70%" height={14} borderRadius={6} />
        </View>
      </View>
      <View className="flex-row items-center justify-between mt-3">
        <SkeletonItem width={60} height={12} borderRadius={4} />
        <SkeletonItem width={14} height={14} borderRadius={7} />
      </View>
    </View>
  );
}

export function SnapCardSkeleton() {
  return (
    <View
      className="bg-card rounded-2xl p-4 mb-3 mx-4 overflow-hidden"
      style={{
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      }}
    >
      {/* Accent bar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#E0E0E0' }} />
      <View className="flex-row items-center justify-between mb-3 mt-1">
        <SkeletonItem width={80} height={20} borderRadius={10} />
        <SkeletonItem width={50} height={20} borderRadius={10} />
      </View>
      {/* Hook skeleton */}
      <View className="bg-primary-light rounded-xl p-3 mb-3">
        <SkeletonItem height={14} borderRadius={6} />
        <View className="mt-1">
          <SkeletonItem width="80%" height={14} borderRadius={6} />
        </View>
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
    <View
      className="bg-card rounded-2xl p-4 mb-3 mx-4"
      style={{
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      }}
    >
      <View className="flex-row items-center gap-3 mb-3">
        <SkeletonItem width={32} height={32} borderRadius={16} />
        <View className="flex-1">
          <SkeletonItem height={20} borderRadius={6} />
        </View>
      </View>
      <View className="mt-1">
        <SkeletonItem height={14} borderRadius={6} />
        <View className="mt-1.5">
          <SkeletonItem width="85%" height={14} borderRadius={6} />
        </View>
      </View>
      <View className="flex-row gap-3 mt-4">
        {[0, 1, 2].map((i) => (
          <View key={i} className="flex-1">
            <SkeletonItem height={12} borderRadius={4} />
            <View className="mt-1.5">
              <SkeletonItem height={6} borderRadius={3} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default SkeletonItem;
