import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, TextInput as RNTextInput, StatusBar, Text, TouchableOpacity, View } from 'react-native';


export default function LoginScreen() {
    const router = useRouter();
    const [badgeNumber, setBadgeNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSignIn() {
        if (!badgeNumber || !password) {
            Alert.alert('Missing information', 'Please enter your badge number and password.');
            return;
        }
        
        setLoading(true);
        // Simulate sign in
        setTimeout(() => {
            setLoading(false);
            router.replace('/');
        }, 800);
    }

    // Light theme colors
    const borderColor = '#E5E7EB';
    const surfaceVariant = '#F9FAFB';
    const textSecondary = '#6B7280';
    const backgroundColor = '#FFFFFF';
    const textColor = '#111827';
    const tintColor = '#3B82F6';

    return (
        <View style={{ flex: 1, backgroundColor: backgroundColor, paddingHorizontal: 24, paddingTop: 48 }}>
            <Stack.Screen options={{ title: 'Sign in', headerShown: false }} />
            <StatusBar
                barStyle="dark-content"
                backgroundColor={backgroundColor}
            />
            
            {/* Title */}
            <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: textColor, marginBottom: 8 }}>
                    Welcome back
                </Text>
                <Text style={{ fontSize: 16, color: textSecondary }}>
                    Sign in to continue
                </Text>
            </View>

            {/* Badge Number Input */}
            <View style={{ marginBottom: 16 }}>
                <RNTextInput
                    style={{ 
                        backgroundColor: surfaceVariant,
                        borderWidth: 1,
                        borderColor: borderColor,
                        color: textColor,
                        marginBottom: 16,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        fontSize: 16,
                    }}
                    placeholder="Please enter your Badge Number"
                    value={badgeNumber}
                    onChangeText={setBadgeNumber}
                    placeholderTextColor={textSecondary}
                    keyboardType="numeric"
                    autoCapitalize="none"
                />

                {/* Password Input with Eye Icon */}
                <View style={{ position: 'relative', marginBottom: 8 }}>
                    <RNTextInput
                        style={{ 
                            backgroundColor: surfaceVariant,
                            borderWidth: 1,
                            borderColor: borderColor,
                            color: textColor,
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
                        placeholderTextColor={textSecondary}
                    />
                    <TouchableOpacity
                        style={{ 
                            position: 'absolute',
                            right: 16,
                            top: '50%',
                            transform: [{ translateY: -10 }],
                        }}
                        onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color={textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Forgot Password */}
                <View style={{ alignItems: 'flex-end' }}>
                    <TouchableOpacity>
                        <Text style={{ fontSize: 14, color: textSecondary }}>Forgot password?</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
                style={{ 
                    marginTop: 24,
                    borderRadius: 12,
                    paddingVertical: 16,
                    backgroundColor: tintColor
                }}
                onPress={handleSignIn}
                disabled={loading}>
                <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '600', color: 'white' }}>
                    {loading ? 'LOADING...' : 'LOGIN'}
                </Text>
            </TouchableOpacity>

        </View>
    );
}

