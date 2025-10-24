import { useOfficerAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, TextInput as RNTextInput, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function LoginScreen() {
    const router = useRouter();
    const { signIn, isLoading, error } = useOfficerAuth();
    const { colors, activeTheme } = useTheme();
    const [badgeNumber, setBadgeNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [showAlreadySignedInModal, setShowAlreadySignedInModal] = useState(false);

    async function handleSignIn() {
        if (!badgeNumber || !password) {
            setLocalError('Please enter your badge number and password.');
            return;
        }
        
        setLocalError(null);
        setIsLoggingIn(true);
        
        try {
            const result = await signIn(badgeNumber, password);
            
            if (result.error) {
                // Check if error is about account already signed in
                if (result.error.toLowerCase().includes('database error granting user')) {
                    setShowAlreadySignedInModal(true);
                } else {
                    setLocalError(result.error);
                }
            } else {
                // Successful login - navigation will be handled by auth state changes
                router.replace('/');
            }
        } catch (error) {
            setLocalError('An unexpected error occurred. Please try again.');
            console.error('Login error:', error);
        } finally {
            setIsLoggingIn(false);
        }
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 48 }}>
                <Stack.Screen options={{ title: 'Sign in', headerShown: false }} />
                <StatusBar
                    barStyle={activeTheme === 'dark' ? "light-content" : "dark-content"}
                    backgroundColor={colors.background}
                />
            
            {/* Title */}
            <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                    Welcome back
                </Text>
                <Text style={{ fontSize: 16, color: colors.textSecondary }}>
                    Sign in to continue
                </Text>
            </View>

            {/* Badge Number Input */}
            <View style={{ marginBottom: 16 }}>
                <RNTextInput
                    style={{ 
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                        color: colors.text,
                        marginBottom: 16,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        fontSize: 16,
                    }}
                    placeholder="Please enter your Badge Number"
                    value={badgeNumber}
                    onChangeText={setBadgeNumber}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    autoCapitalize="none"
                />

                {/* Password Input with Eye Icon */}
                <View style={{ position: 'relative', marginBottom: 8 }}>
                    <RNTextInput
                        style={{ 
                            backgroundColor: colors.card,
                            borderWidth: 1,
                            borderColor: colors.border,
                            color: colors.text,
                            borderRadius: 12,
                            paddingHorizontal: 16,
                            paddingVertical: 16,
                            paddingRight: 48,
                            fontSize: 16,
                        }}
                        placeholder="Please enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        placeholderTextColor={colors.textSecondary}
                    />
                    <TouchableOpacity
                        style={{ 
                            position: 'absolute',
                            right: 16,
                            top: '50%',
                            transform: [{ translateY: -10 }],
                        }}
                        onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Forgot Password */}
                <View style={{ alignItems: 'flex-end' }}>
                    <TouchableOpacity onPress={() => setShowForgotModal(true)}>
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>Forgot password?</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Error Display */}
            {(error || localError) && (
                <View style={{ marginTop: 16, padding: 12, backgroundColor: '#FEE2E2', borderRadius: 8 }}>
                    <Text style={{ color: '#DC2626', fontSize: 14, textAlign: 'center' }}>
                        {error || localError}
                    </Text>
                </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
                style={{ 
                    marginTop: 24,
                    borderRadius: 12,
                    paddingVertical: 16,
                    backgroundColor: (isLoading || isLoggingIn) ? colors.border : colors.primary,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                }}
                onPress={handleSignIn}
                disabled={isLoading || isLoggingIn}>
                {(isLoading || isLoggingIn) && (
                    <ActivityIndicator size="small" color="white" />
                )}
                <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '600', color: 'white' }}>
                    {(isLoading || isLoggingIn) ? 'SIGNING IN...' : 'LOGIN'}
                </Text>
            </TouchableOpacity>

            </View>

            {/* Forgot Password Info Modal */}
            <Modal
                visible={showForgotModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowForgotModal(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowForgotModal(false)}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 20,
                    }}
                >
                    <View
                        style={{
                            width: '100%',
                            maxWidth: 400,
                            borderRadius: 16,
                            padding: 24,
                            alignItems: 'center',
                            backgroundColor: colors.card,
                        }}
                    >
                        <Ionicons name="information-circle-outline" size={48} color={colors.primary} />
                        <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 12, color: colors.text, textAlign: 'center' }}>
                            Password Reset
                        </Text>
                        <Text style={{ fontSize: 16, marginTop: 8, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
                            Please visit your department's admin to reset your password.
                        </Text>

                        <TouchableOpacity
                            onPress={() => setShowForgotModal(false)}
                            style={{
                                marginTop: 16,
                                paddingVertical: 12,
                                paddingHorizontal: 24,
                                borderRadius: 10,
                                backgroundColor: colors.primary,
                            }}
                        >
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Already Signed In Modal */}
            <Modal
                visible={showAlreadySignedInModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAlreadySignedInModal(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowAlreadySignedInModal(false)}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 20,
                    }}
                >
                    <View
                        style={{
                            width: '100%',
                            maxWidth: 400,
                            borderRadius: 16,
                            padding: 24,
                            alignItems: 'center',
                            backgroundColor: colors.card,
                        }}
                    >
                        <Ionicons name="alert-circle-outline" size={48} color="#F59E0B" />
                        <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 12, color: colors.text, textAlign: 'center' }}>
                            Account Already Signed In
                        </Text>
                        <Text style={{ fontSize: 16, marginTop: 8, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
                            This account is already signed in on another device. If this wasn't you, please contact your department's admin.
                        </Text>

                        <TouchableOpacity
                            onPress={() => setShowAlreadySignedInModal(false)}
                            style={{
                                marginTop: 16,
                                paddingVertical: 12,
                                paddingHorizontal: 24,
                                borderRadius: 10,
                                backgroundColor: colors.primary,
                            }}
                        >
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

