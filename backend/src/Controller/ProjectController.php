<?php

namespace App\Controller;

use App\Repository\ProjectRepository;
use App\Service\ProjectService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/projects', name: 'api_projects_')]
#[IsGranted('ROLE_USER')]
class ProjectController extends AbstractController
{
    public function __construct(
        private readonly ProjectService    $projectService,
        private readonly ProjectRepository $projectRepository,
    ) {}

    /**
     * GET /api/projects
     * Retourne tous les projets de l'utilisateur connecté.
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user     = $this->getUser();
        $projects = $this->projectRepository->findByUser($user);

        return $this->json([
            'success' => true,
            'data'    => array_map(fn($p) => $this->projectService->serialize($p), $projects),
            'meta'    => ['total' => count($projects)],
        ]);
    }

    /**
     * POST /api/projects
     * Body : { "title": "...", "genre": "...", "project_type": "novel|team" }
     */
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (empty($data['title'])) {
            return $this->json(['success' => false, 'error' => 'Le titre est requis.'], Response::HTTP_BAD_REQUEST);
        }

        $project = $this->projectService->create($user, $data);

        return $this->json([
            'success' => true,
            'data'    => $this->projectService->serialize($project, withSteps: true),
        ], Response::HTTP_CREATED);
    }

    /**
     * GET /api/projects/{id}
     * Retourne un projet avec ses étapes Snowflake.
     */
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(string $id): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user    = $this->getUser();
        $project = $this->projectRepository->findOneByIdAndUser($id, $user);

        if (!$project) {
            return $this->json(['success' => false, 'error' => 'Projet introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'success' => true,
            'data'    => $this->projectService->serialize($project, withSteps: true),
        ]);
    }

    /**
     * PATCH /api/projects/{id}
     * Body : { "title"?: "...", "genre"?: "...", "cover_url"?: "..." }
     */
    #[Route('/{id}', name: 'update', methods: ['PATCH'])]
    public function update(string $id, Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user    = $this->getUser();
        $project = $this->projectRepository->findOneByIdAndUser($id, $user);

        if (!$project) {
            return $this->json(['success' => false, 'error' => 'Projet introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data    = json_decode($request->getContent(), true);
        $project = $this->projectService->update($project, $data);

        return $this->json([
            'success' => true,
            'data'    => $this->projectService->serialize($project),
        ]);
    }

    /**
     * DELETE /api/projects/{id}
     */
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user    = $this->getUser();
        $project = $this->projectRepository->findOneByIdAndUser($id, $user);

        if (!$project) {
            return $this->json(['success' => false, 'error' => 'Projet introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->projectService->delete($project);

        return $this->json(['success' => true, 'data' => null], Response::HTTP_OK);
    }

    /**
     * PATCH /api/projects/{id}/steps/{step}
     * Body : { "content": "..." }
     * Met à jour une étape Snowflake (1 = Prémisse, 2 = Résumé, 3 = Personnages, 4 = Synopsis).
     */
    #[Route('/{id}/steps/{step}', name: 'update_step', methods: ['PATCH'], requirements: ['step' => '[1-4]'])]
    public function updateStep(string $id, int $step, Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user    = $this->getUser();
        $project = $this->projectRepository->findOneByIdAndUser($id, $user);

        if (!$project) {
            return $this->json(['success' => false, 'error' => 'Projet introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data    = json_decode($request->getContent(), true);
        $content = $data['content'] ?? '';

        $snowflakeStep = $this->projectService->updateStep($project, $step, $content);

        return $this->json([
            'success' => true,
            'data'    => [
                'id'          => (string) $snowflakeStep->getId(),
                'step_number' => $snowflakeStep->getStepNumber(),
                'content'     => $snowflakeStep->getContent(),
                'updated_at'  => $snowflakeStep->getUpdatedAt()->format(\DateTimeInterface::ATOM),
            ],
        ]);
    }
}
