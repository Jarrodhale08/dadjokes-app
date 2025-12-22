import React, { memo } from 'react';
import { View, FlatList, StyleSheet, ViewStyle, ListRenderItem } from 'react-native';

interface ListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  horizontal?: boolean;
  numColumns?: number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}

function List<T>({
  data,
  renderItem,
  keyExtractor,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  contentContainerStyle,
  horizontal = false,
  numColumns,
  onEndReached,
  onEndReachedThreshold = 0.5,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
}: ListProps<T>) {
  const containerStyle = [
    styles.container,
    styles[`container_${variant}`],
    styles[`container_${size}`],
    disabled && styles.containerDisabled,
    style,
  ];

  const contentStyle = [
    styles.contentContainer,
    styles[`contentContainer_${size}`],
    contentContainerStyle,
  ];

  return (
    <View style={containerStyle} accessibilityRole="list">
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={contentStyle}
        horizontal={horizontal}
        numColumns={numColumns}
        scrollEnabled={!disabled}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  container_primary: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  container_secondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  container_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  container_ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  container_danger: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  container_sm: {
    minHeight: 100,
  },
  container_md: {
    minHeight: 200,
  },
  container_lg: {
    minHeight: 300,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  contentContainer: {
    flexGrow: 1,
  },
  contentContainer_sm: {
    padding: 8,
  },
  contentContainer_md: {
    padding: 12,
  },
  contentContainer_lg: {
    padding: 16,
  },
});

export { List };
export default memo(List) as typeof List;
