import React, { useEffect, useRef } from 'react';
import { View, Animated, type DimensionValue } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
}

function SkeletonItem({ width, height = 16, borderRadius = 8 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const { colors } = useTheme();

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
        backgroundColor: colors.border,
        opacity,
      }}
    />
  );
}

export function NewsCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        marginHorizontal: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <SkeletonItem width={60} height={20} borderRadius={10} />
        <SkeletonItem width={80} height={14} borderRadius={6} />
      </View>
      <SkeletonItem height={20} borderRadius={6} />
      <View style={{ marginTop: 8 }}>
        <SkeletonItem height={14} borderRadius={6} />
        <View style={{ marginTop: 6 }}>
          <SkeletonItem width="70%" height={14} borderRadius={6} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <SkeletonItem width={60} height={12} borderRadius={4} />
        <SkeletonItem width={14} height={14} borderRadius={7} />
      </View>
    </View>
  );
}

export function SnapCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        marginHorizontal: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      }}
    >
      {/* Accent bar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: colors.border }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
        <SkeletonItem width={80} height={20} borderRadius={10} />
        <SkeletonItem width={50} height={20} borderRadius={10} />
      </View>
      {/* Hook skeleton */}
      <View style={{ backgroundColor: colors.primaryLight, borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <SkeletonItem height={14} borderRadius={6} />
        <View style={{ marginTop: 4 }}>
          <SkeletonItem width="80%" height={14} borderRadius={6} />
        </View>
      </View>
      <SkeletonItem height={22} borderRadius={6} />
      <View style={{ marginTop: 12 }}>
        <SkeletonItem height={14} borderRadius={6} />
        <View style={{ marginTop: 4 }}>
          <SkeletonItem height={14} borderRadius={6} />
        </View>
        <View style={{ marginTop: 4 }}>
          <SkeletonItem width="60%" height={14} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

export function IdeaCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        marginHorizontal: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <SkeletonItem width={32} height={32} borderRadius={16} />
        <View style={{ flex: 1 }}>
          <SkeletonItem height={20} borderRadius={6} />
        </View>
      </View>
      <View style={{ marginTop: 4 }}>
        <SkeletonItem height={14} borderRadius={6} />
        <View style={{ marginTop: 6 }}>
          <SkeletonItem width="85%" height={14} borderRadius={6} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flex: 1 }}>
            <SkeletonItem height={12} borderRadius={4} />
            <View style={{ marginTop: 6 }}>
              <SkeletonItem height={6} borderRadius={3} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default SkeletonItem;
