import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LoginScreen() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleSignIn() {
		if (!email || !password) {
			Alert.alert('Missing information', 'Please enter your email and password.');
			return;
		}
		setIsSubmitting(true);
			setTimeout(() => {
			setIsSubmitting(false);
			Alert.alert('Signed in', 'Demo sign-in complete.');
				router.replace('/(tabs)');
		}, 800);
	}

	return (
		<ThemedView style={{ flex: 1 }}>
			<Stack.Screen options={{ title: 'Sign in' }} />
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.select({ ios: 'padding', android: undefined })}
			>
				<ThemedView
					style={{
						flex: 1,
						paddingHorizontal: 24,
						paddingTop: 48,
						gap: 24,
						justifyContent: 'flex-start',
					}}
				>
					<ThemedText type="title" style={{ fontSize: 28, fontWeight: '700' }}>
						Welcome back
					</ThemedText>
					<ThemedText type="default" style={{ opacity: 0.7 }}>
						Sign in to continue
					</ThemedText>

					<ThemedView style={{ gap: 16, marginTop: 12 }}>
						<ThemedText style={{ fontSize: 14, opacity: 0.8 }}>Email</ThemedText>
						<TextInput
							style={{
								paddingHorizontal: 14,
								paddingVertical: Platform.select({ ios: 14, android: 10 }),
								borderRadius: 12,
								borderWidth: 1,
								borderColor: '#cccccc',
								backgroundColor: 'transparent',
							}}
							placeholder="you@example.com"
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
							value={email}
							onChangeText={setEmail}
						/>

						<ThemedText style={{ fontSize: 14, opacity: 0.8, marginTop: 8 }}>Password</ThemedText>
						<TextInput
							style={{
								paddingHorizontal: 14,
								paddingVertical: Platform.select({ ios: 14, android: 10 }),
								borderRadius: 12,
								borderWidth: 1,
								borderColor: '#cccccc',
								backgroundColor: 'transparent',
							}}
							placeholder="••••••••"
							autoCapitalize="none"
							autoCorrect={false}
							secureTextEntry
							value={password}
							onChangeText={setPassword}
						/>
					</ThemedView>

					<TouchableOpacity
						activeOpacity={0.8}
						disabled={isSubmitting}
						onPress={handleSignIn}
						style={{
							backgroundColor: '#1f6feb',
							paddingVertical: 14,
							borderRadius: 14,
							alignItems: 'center',
							marginTop: 24,
						}}
					>
						<ThemedText style={{ color: 'white', fontWeight: '700' }}>
							{isSubmitting ? 'Signing in…' : 'Sign in'}
						</ThemedText>
					</TouchableOpacity>

					<TouchableOpacity
						accessibilityRole="button"
						onPress={() => router.back()}
						style={{ alignItems: 'center', paddingVertical: 10 }}
					>
						<ThemedText style={{ opacity: 0.8 }}>Cancel</ThemedText>
					</TouchableOpacity>
				</ThemedView>
			</KeyboardAvoidingView>
		</ThemedView>
	);
}


