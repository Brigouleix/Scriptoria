<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthService
{
    public function __construct(
        private readonly EntityManagerInterface      $em,
        private readonly UserRepository              $userRepository,
        private readonly UserPasswordHasherInterface $hasher,
    ) {}

    /**
     * Inscrit un nouvel utilisateur.
     *
     * @throws \InvalidArgumentException si l'email est déjà utilisé
     */
    public function register(string $email, string $plainPassword): User
    {
        if ($this->userRepository->findByEmail($email)) {
            throw new \InvalidArgumentException('Cet email est déjà utilisé.');
        }

        $user = new User();
        $user->setEmail($email);
        $user->setPassword($this->hasher->hashPassword($user, $plainPassword));

        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    /**
     * Vérifie les identifiants et retourne l'utilisateur si valides.
     *
     * @throws \InvalidArgumentException si les identifiants sont incorrects
     */
    public function authenticate(string $email, string $plainPassword): User
    {
        $user = $this->userRepository->findByEmail($email);

        if (!$user || !$this->hasher->isPasswordValid($user, $plainPassword)) {
            throw new \InvalidArgumentException('Email ou mot de passe incorrect.');
        }

        return $user;
    }

    /**
     * Sérialise un utilisateur en tableau pour les réponses API.
     */
    public function serialize(User $user): array
    {
        return [
            'id'         => (string) $user->getId(),
            'email'      => $user->getEmail(),
            'roles'      => $user->getRoles(),
            'created_at' => $user->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
