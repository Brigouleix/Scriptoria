<?php

namespace App\Controller;

use App\Service\AuthService;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth', name: 'api_auth_')]
class AuthController extends AbstractController
{
    public function __construct(
        private readonly AuthService             $authService,
        private readonly JWTTokenManagerInterface $jwtManager,
    ) {}

    /**
     * POST /api/auth/register
     * Body : { "email": "...", "password": "..." }
     */
    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['email']) || empty($data['password'])) {
            return $this->json(['success' => false, 'error' => 'Email et mot de passe requis.'], Response::HTTP_BAD_REQUEST);
        }

        if (strlen($data['password']) < 8) {
            return $this->json(['success' => false, 'error' => 'Le mot de passe doit contenir au moins 8 caractères.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $user  = $this->authService->register($data['email'], $data['password']);
            $token = $this->jwtManager->create($user);

            return $this->json([
                'success' => true,
                'data'    => [
                    'token' => $token,
                    'user'  => $this->authService->serialize($user),
                ],
            ], Response::HTTP_CREATED);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['success' => false, 'error' => $e->getMessage()], Response::HTTP_CONFLICT);
        }
    }

    /**
     * POST /api/auth/login
     * Body : { "email": "...", "password": "..." }
     * Note : Lexik gère le /api/auth/login automatiquement via security.yaml.
     * Ce controller est fourni comme alternative manuelle ou pour les tests.
     */
    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['email']) || empty($data['password'])) {
            return $this->json(['success' => false, 'error' => 'Email et mot de passe requis.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $user  = $this->authService->authenticate($data['email'], $data['password']);
            $token = $this->jwtManager->create($user);

            return $this->json([
                'success' => true,
                'data'    => [
                    'token' => $token,
                    'user'  => $this->authService->serialize($user),
                ],
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['success' => false, 'error' => $e->getMessage()], Response::HTTP_UNAUTHORIZED);
        }
    }

    /**
     * GET /api/auth/me
     * Header : Authorization: Bearer <token>
     */
    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['success' => false, 'error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'success' => true,
            'data'    => $this->authService->serialize($user),
        ]);
    }
}
