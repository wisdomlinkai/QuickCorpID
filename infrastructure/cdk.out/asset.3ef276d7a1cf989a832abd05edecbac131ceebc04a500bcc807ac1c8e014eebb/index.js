"use strict";
/**
 * QuickCorpID Auth Service - Lambda Entry Point
 *
 * API Gateway handler for authentication endpoints
 *
 * Routes:
 *   POST /auth/signup           - Sign up
 *   POST /auth/signin           - Sign in
 *   POST /auth/refresh          - Refresh tokens
 *   POST /auth/logout           - Sign out
 *   GET  /auth/me               - Get profile
 *   PUT  /auth/me               - Update profile
 *   POST /auth/forgot-password  - Forgot password
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSignOut = exports.handleUpdateProfile = exports.handleGetProfile = exports.handleRefreshToken = exports.handleSignIn = exports.handleSignUp = void 0;
exports.handler = handler;
const handlers_1 = require("./handlers");
Object.defineProperty(exports, "handleSignUp", { enumerable: true, get: function () { return handlers_1.handleSignUp; } });
Object.defineProperty(exports, "handleSignIn", { enumerable: true, get: function () { return handlers_1.handleSignIn; } });
Object.defineProperty(exports, "handleRefreshToken", { enumerable: true, get: function () { return handlers_1.handleRefreshToken; } });
Object.defineProperty(exports, "handleGetProfile", { enumerable: true, get: function () { return handlers_1.handleGetProfile; } });
Object.defineProperty(exports, "handleUpdateProfile", { enumerable: true, get: function () { return handlers_1.handleUpdateProfile; } });
Object.defineProperty(exports, "handleSignOut", { enumerable: true, get: function () { return handlers_1.handleSignOut; } });
// Route mapping
const routes = {
    '/auth/signup': { POST: handlers_1.handleSignUp },
    '/auth/signin': { POST: handlers_1.handleSignIn },
    '/auth/refresh': { POST: handlers_1.handleRefreshToken },
    '/auth/logout': { POST: handlers_1.handleSignOut },
    '/auth/me': { GET: handlers_1.handleGetProfile, PUT: handlers_1.handleUpdateProfile },
    '/auth/forgot-password': { POST: handlers_1.handleForgotPassword },
};
/**
 * Main Lambda handler
 */
async function handler(event) {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            },
            body: '',
        };
    }
    // Find route handler
    const route = routes[event.path];
    if (!route) {
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Not found' }),
        };
    }
    const handler = route[event.httpMethod];
    if (!handler) {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
    // Execute handler
    return handler(event);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7O0dBYUc7OztBQTBCSCwwQkFtQ0M7QUExREQseUNBUW9CO0FBcURYLDZGQTVEUCx1QkFBWSxPQTRETztBQUFFLDZGQTNEckIsdUJBQVksT0EyRHFCO0FBQUUsbUdBMURuQyw2QkFBa0IsT0EwRG1DO0FBQUUsaUdBekR2RCwyQkFBZ0IsT0F5RHVEO0FBQUUsb0dBeER6RSw4QkFBbUIsT0F3RHlFO0FBQUUsOEZBdkQ5Rix3QkFBYSxPQXVEOEY7QUFuRDdHLGdCQUFnQjtBQUNoQixNQUFNLE1BQU0sR0FBNEY7SUFDdEcsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLHVCQUFZLEVBQUU7SUFDdEMsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLHVCQUFZLEVBQUU7SUFDdEMsZUFBZSxFQUFFLEVBQUUsSUFBSSxFQUFFLDZCQUFrQixFQUFFO0lBQzdDLGNBQWMsRUFBRSxFQUFFLElBQUksRUFBRSx3QkFBYSxFQUFFO0lBQ3ZDLFVBQVUsRUFBRSxFQUFFLEdBQUcsRUFBRSwyQkFBZ0IsRUFBRSxHQUFHLEVBQUUsOEJBQW1CLEVBQUU7SUFDL0QsdUJBQXVCLEVBQUUsRUFBRSxJQUFJLEVBQUUsK0JBQW9CLEVBQUU7Q0FDeEQsQ0FBQztBQUVGOztHQUVHO0FBQ0ksS0FBSyxVQUFVLE9BQU8sQ0FBQyxLQUFzQjtJQUNsRCx3QkFBd0I7SUFDeEIsSUFBSSxLQUFLLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ25DLE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRTtnQkFDUCw2QkFBNkIsRUFBRSxHQUFHO2dCQUNsQyw4QkFBOEIsRUFBRSw0QkFBNEI7Z0JBQzVELDhCQUE4QixFQUFFLDZCQUE2QjthQUM5RDtZQUNELElBQUksRUFBRSxFQUFFO1NBQ1QsQ0FBQztJQUNKLENBQUM7SUFFRCxxQkFBcUI7SUFDckIsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDWCxPQUFPO1lBQ0wsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUUsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUU7WUFDL0MsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLENBQUM7U0FDN0MsQ0FBQztJQUNKLENBQUM7SUFFRCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3hDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNiLE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRSxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRTtZQUMvQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxvQkFBb0IsRUFBRSxDQUFDO1NBQ3RELENBQUM7SUFDSixDQUFDO0lBRUQsa0JBQWtCO0lBQ2xCLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFF1aWNrQ29ycElEIEF1dGggU2VydmljZSAtIExhbWJkYSBFbnRyeSBQb2ludFxuICogXG4gKiBBUEkgR2F0ZXdheSBoYW5kbGVyIGZvciBhdXRoZW50aWNhdGlvbiBlbmRwb2ludHNcbiAqIFxuICogUm91dGVzOlxuICogICBQT1NUIC9hdXRoL3NpZ251cCAgICAgICAgICAgLSBTaWduIHVwXG4gKiAgIFBPU1QgL2F1dGgvc2lnbmluICAgICAgICAgICAtIFNpZ24gaW5cbiAqICAgUE9TVCAvYXV0aC9yZWZyZXNoICAgICAgICAgIC0gUmVmcmVzaCB0b2tlbnNcbiAqICAgUE9TVCAvYXV0aC9sb2dvdXQgICAgICAgICAgIC0gU2lnbiBvdXRcbiAqICAgR0VUICAvYXV0aC9tZSAgICAgICAgICAgICAgIC0gR2V0IHByb2ZpbGVcbiAqICAgUFVUICAvYXV0aC9tZSAgICAgICAgICAgICAgIC0gVXBkYXRlIHByb2ZpbGVcbiAqICAgUE9TVCAvYXV0aC9mb3Jnb3QtcGFzc3dvcmQgIC0gRm9yZ290IHBhc3N3b3JkXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBBUElHYXRld2F5RXZlbnQsIEFQSUdhdGV3YXlSZXNwb25zZSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtcbiAgaGFuZGxlU2lnblVwLFxuICBoYW5kbGVTaWduSW4sXG4gIGhhbmRsZVJlZnJlc2hUb2tlbixcbiAgaGFuZGxlR2V0UHJvZmlsZSxcbiAgaGFuZGxlVXBkYXRlUHJvZmlsZSxcbiAgaGFuZGxlU2lnbk91dCxcbiAgaGFuZGxlRm9yZ290UGFzc3dvcmQsXG59IGZyb20gJy4vaGFuZGxlcnMnO1xuXG4vLyBSb3V0ZSBtYXBwaW5nXG5jb25zdCByb3V0ZXM6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIChldmVudDogQVBJR2F0ZXdheUV2ZW50KSA9PiBQcm9taXNlPEFQSUdhdGV3YXlSZXNwb25zZT4+PiA9IHtcbiAgJy9hdXRoL3NpZ251cCc6IHsgUE9TVDogaGFuZGxlU2lnblVwIH0sXG4gICcvYXV0aC9zaWduaW4nOiB7IFBPU1Q6IGhhbmRsZVNpZ25JbiB9LFxuICAnL2F1dGgvcmVmcmVzaCc6IHsgUE9TVDogaGFuZGxlUmVmcmVzaFRva2VuIH0sXG4gICcvYXV0aC9sb2dvdXQnOiB7IFBPU1Q6IGhhbmRsZVNpZ25PdXQgfSxcbiAgJy9hdXRoL21lJzogeyBHRVQ6IGhhbmRsZUdldFByb2ZpbGUsIFBVVDogaGFuZGxlVXBkYXRlUHJvZmlsZSB9LFxuICAnL2F1dGgvZm9yZ290LXBhc3N3b3JkJzogeyBQT1NUOiBoYW5kbGVGb3Jnb3RQYXNzd29yZCB9LFxufTtcblxuLyoqXG4gKiBNYWluIExhbWJkYSBoYW5kbGVyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50OiBBUElHYXRld2F5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlSZXNwb25zZT4ge1xuICAvLyBIYW5kbGUgQ09SUyBwcmVmbGlnaHRcbiAgaWYgKGV2ZW50Lmh0dHBNZXRob2QgPT09ICdPUFRJT05TJykge1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZSxBdXRob3JpemF0aW9uJyxcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiAnR0VULFBPU1QsUFVULERFTEVURSxPUFRJT05TJyxcbiAgICAgIH0sXG4gICAgICBib2R5OiAnJyxcbiAgICB9O1xuICB9XG5cbiAgLy8gRmluZCByb3V0ZSBoYW5kbGVyXG4gIGNvbnN0IHJvdXRlID0gcm91dGVzW2V2ZW50LnBhdGhdO1xuICBpZiAoIXJvdXRlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ05vdCBmb3VuZCcgfSksXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGhhbmRsZXIgPSByb3V0ZVtldmVudC5odHRwTWV0aG9kXTtcbiAgaWYgKCFoYW5kbGVyKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDQwNSxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSksXG4gICAgfTtcbiAgfVxuXG4gIC8vIEV4ZWN1dGUgaGFuZGxlclxuICByZXR1cm4gaGFuZGxlcihldmVudCk7XG59XG5cbi8vIEV4cG9ydCBmb3IgdGVzdGluZ1xuZXhwb3J0IHsgaGFuZGxlU2lnblVwLCBoYW5kbGVTaWduSW4sIGhhbmRsZVJlZnJlc2hUb2tlbiwgaGFuZGxlR2V0UHJvZmlsZSwgaGFuZGxlVXBkYXRlUHJvZmlsZSwgaGFuZGxlU2lnbk91dCB9O1xuIl19