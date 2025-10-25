import { useOfficerAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, TextInput as RNTextInput, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function LoginScreen() {
    const router = useRouter();
    const { signIn, isLoading, error, signOut } = useOfficerAuth();
    const { colors, activeTheme } = useTheme();
    const [badgeNumber, setBadgeNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [showAlreadySignedInModal, setShowAlreadySignedInModal] = useState(false);
    const lastOfflineAtRef = useRef<number | null>(null);
    const lastTriedBadgeRef = useRef<string>('');

    // Normalize certain backend error messages into a clearer, user-facing string
    const displayedError: string | null = (() => {
        if (error) {
            try {
                const err = String(error).toLowerCase();
                // Map the backend "Auth session missing" (or similar variants) to a clearer message
                if (err.includes('auth session missing') || err.includes('auth_session_missing') || err.includes('session missing')) {
                    return 'Your account has been signed out';
                }
            } catch (e) {
                // fall through and show the raw error if string conversion fails
            }
            return String(error);
        }

        return localError;
    })();

    async function handleSignIn() {
        if (!badgeNumber || !password) {
            setLocalError('Please enter your badge number and password.');
            return;
        }
        
        setLocalError(null);
        setIsLoggingIn(true);
        
        try {
            // Save current attempt details
            lastTriedBadgeRef.current = badgeNumber;

            // Pre-check connectivity to avoid partial sessions and misleading errors
            const networkState = await Network.getNetworkStateAsync();
            if (!networkState.isInternetReachable) {
                lastOfflineAtRef.current = Date.now();
                setLocalError('Failed to login. Please check your internet connection and try again later');
                return;
            }

            // Clear any existing session state before attempting login (clean slate)
            await signOut();

            const result = await signIn(badgeNumber, password);
            
            if (result.error) {
                const errorLower = result.error.toLowerCase();

                // Specific case: backend reports this account session grant issue
                if (errorLower.includes('database error granting user')) {
                    setShowAlreadySignedInModal(true);
                    return;
                }

                // If we were recently offline, treat false negatives as network recovery issues
                const wasRecentlyOffline = !!(lastOfflineAtRef.current && (Date.now() - lastOfflineAtRef.current < 60000));
                if (wasRecentlyOffline && (errorLower.includes('officer not found') || errorLower.includes('not found'))) {
                    setLocalError('Failed to login. Please check your internet connection and try again later');
                    return;
                }

                // Network-related errors
                if (
                    errorLower.includes('network') ||
                    errorLower.includes('fetch') ||
                    errorLower.includes('connection') ||
                    errorLower.includes('timeout') ||
                    errorLower.includes('refused') ||
                    errorLower.includes('unreachable')
                ) {
                    lastOfflineAtRef.current = Date.now();
                    setLocalError('Failed to login. Please check your internet connection and try again later');
                } else if (errorLower.includes('database error')) {
                    // Database/session grant hiccups after connectivity blips
                    setLocalError('Failed to login. Please check your internet connection and try again later');
                } else {
                    // Show the actual error (e.g., truly invalid credentials)
                    setLocalError(result.error);
                }
            } else {
                // Successful login - navigation will be handled by auth state changes
                lastOfflineAtRef.current = null;
                router.replace('/');
            }
        } catch (error) {
            setLocalError('Failed to login. Please check your internet connection and try again later');
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
            {displayedError && (
                <View style={{ marginTop: 16, padding: 12, backgroundColor: '#FEE2E2', borderRadius: 8 }}>
                    <Text style={{ color: '#DC2626', fontSize: 14, textAlign: 'center' }}>
                        {displayedError}
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

