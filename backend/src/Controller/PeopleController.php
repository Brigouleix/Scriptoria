<?php

namespace App\Controller;

use App\Repository\CharacterLinkRepository;
use App\Repository\PersonRepository;
use App\Service\PeopleService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/people', name: 'api_people_')]
#[IsGranted('ROLE_USER')]
class PeopleController extends AbstractController
{
    public function __construct(
        private readonly PeopleService           $peopleService,
        private readonly PersonRepository        $personRepository,
        private readonly CharacterLinkRepository $linkRepository,
    ) {}

    /**
     * GET /api/people
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user   = $this->getUser();
        $people = $this->personRepository->findByUser($user);
        $links  = $this->linkRepository->findByUser($user);

        return $this->json([
            'success' => true,
            'data'    => [
                'people' => array_map(fn($p) => $this->peopleService->serialize($p), $people),
                'links'  => array_map(fn($l) => $this->peopleService->serializeLink($l), $links),
            ],
            'meta' => ['total' => count($people)],
        ]);
    }

    /**
     * POST /api/people
     * Body : { "name": "...", "bio"?: "..." }
     */
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (empty($data['name'])) {
            return $this->json(['success' => false, 'error' => 'Le nom est requis.'], Response::HTTP_BAD_REQUEST);
        }

        $person = $this->peopleService->create($user, $data);

        return $this->json([
            'success' => true,
            'data'    => $this->peopleService->serialize($person),
        ], Response::HTTP_CREATED);
    }

    /**
     * PATCH /api/people/{id}
     * Body : { "name"?: "...", "bio"?: "...", "avatar_url"?: "..." }
     */
    #[Route('/{id}', name: 'update', methods: ['PATCH'])]
    public function update(string $id, Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user   = $this->getUser();
        $person = $this->personRepository->findOneByIdAndUser($id, $user);

        if (!$person) {
            return $this->json(['success' => false, 'error' => 'Personnage introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data   = json_decode($request->getContent(), true);
        $person = $this->peopleService->update($person, $data);

        return $this->json([
            'success' => true,
            'data'    => $this->peopleService->serialize($person),
        ]);
    }

    /**
     * DELETE /api/people/{id}
     */
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user   = $this->getUser();
        $person = $this->personRepository->findOneByIdAndUser($id, $user);

        if (!$person) {
            return $this->json(['success' => false, 'error' => 'Personnage introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->peopleService->delete($person);

        return $this->json(['success' => true, 'data' => null]);
    }

    /**
     * POST /api/people/links
     * Body : { "person_a_id": "...", "person_b_id": "...", "relationship"?: "..." }
     */
    #[Route('/links', name: 'link_create', methods: ['POST'])]
    public function createLink(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (empty($data['person_a_id']) || empty($data['person_b_id'])) {
            return $this->json(['success' => false, 'error' => 'person_a_id et person_b_id sont requis.'], Response::HTTP_BAD_REQUEST);
        }

        $personA = $this->personRepository->findOneByIdAndUser($data['person_a_id'], $user);
        $personB = $this->personRepository->findOneByIdAndUser($data['person_b_id'], $user);

        if (!$personA || !$personB) {
            return $this->json(['success' => false, 'error' => 'Personnage(s) introuvable(s).'], Response::HTTP_NOT_FOUND);
        }

        try {
            $link = $this->peopleService->createLink($user, $personA, $personB, $data['relationship'] ?? null);
            return $this->json([
                'success' => true,
                'data'    => $this->peopleService->serializeLink($link),
            ], Response::HTTP_CREATED);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['success' => false, 'error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * DELETE /api/people/links/{id}
     */
    #[Route('/links/{id}', name: 'link_delete', methods: ['DELETE'])]
    public function deleteLink(string $id): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        $link = $this->linkRepository->findOneBy(['id' => $id, 'user' => $user]);

        if (!$link) {
            return $this->json(['success' => false, 'error' => 'Lien introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->peopleService->deleteLink($link);

        return $this->json(['success' => true, 'data' => null]);
    }
}
