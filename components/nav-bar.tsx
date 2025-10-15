import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NavBarProps {
	title: string;
	onLeftPress?: () => void;
	onRightPress?: () => void;
	leftIcon?: keyof typeof Ionicons.glyphMap;
	rightIcon?: keyof typeof Ionicons.glyphMap;
	showLeftIcon?: boolean;
	showRightIcon?: boolean;
}

export function NavBar({
	title,
	onLeftPress,
	onRightPress,
	leftIcon = 'person-circle-outline',
	rightIcon = 'ellipsis-vertical',
	showLeftIcon = true,
	showRightIcon = false,
}: NavBarProps) {
	const { colors } = useTheme();
	
	return (
		<View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
			{showLeftIcon ? (
				<TouchableOpacity
					accessibilityRole="button"
					onPress={onLeftPress}
					style={styles.headerIconBtn}
				>
					<Ionicons name={leftIcon} size={24} color={colors.text} />
				</TouchableOpacity>
			) : (
				<View style={{ width: 40 }} />
			)}
			
			<Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
			
			{showRightIcon ? (
				<TouchableOpacity
					accessibilityRole="button"
					onPress={onRightPress}
					style={styles.headerIconBtn}
				>
					<Ionicons name={rightIcon} size={24} color={colors.text} />
				</TouchableOpacity>
			) : (
				<View style={{ width: 40 }} />
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		height: 56,
		borderBottomWidth: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 8,
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 1 },
		elevation: 1,
	},
	headerIconBtn: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 20,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '700',
	},
});
