<?php

namespace App\Service;

use App\Entity\CharacterLink;
use App\Entity\Person;
use App\Entity\User;
use App\Repository\CharacterLinkRepository;
use App\Repository\PersonRepository;
use Doctrine\ORM\EntityManagerInterface;

class PeopleService
{
    public function __construct(
        private readonly EntityManagerInterface  $em,
        private readonly PersonRepository        $personRepository,
        private readonly CharacterLinkRepository $linkRepository,
    ) {}

    public function create(User $user, array $data): Person
    {
        $person = new Person();
        $person->setUser($user);
        $person->setName($data['name']);
        $person->setBio($data['bio'] ?? null);

        $this->em->persist($person);
        $this->em->flush();

        return $person;
    }

    public function update(Person $person, array $data): Person
    {
        if (isset($data['name']))       $person->setName($data['name']);
        if (array_key_exists('bio', $data)) $person->setBio($data['bio']);
        if (array_key_exists('avatar_url', $data)) $person->setAvatarUrl($data['avatar_url']);

        $this->em->flush();
        return $person;
    }

    public function delete(Person $person): void
    {
        $this->em->remove($person);
        $this->em->flush();
    }

    /**
     * Crée un lien entre deux personnages.
     *
     * @throws \InvalidArgumentException si les personnages n'appartiennent pas au même user
     */
    public function createLink(User $user, Person $personA, Person $personB, ?string $relationship): CharacterLink
    {
        if ((string) $personA->getUser()->getId() !== (string) $user->getId()
            || (string) $personB->getUser()->getId() !== (string) $user->getId()) {
            throw new \InvalidArgumentException('Les personnages doivent appartenir au même utilisateur.');
        }

        $link = new CharacterLink();
        $link->setUser($user);
        $link->setPersonA($personA);
        $link->setPersonB($personB);
        $link->setRelationship($relationship);

        $this->em->persist($link);
        $this->em->flush();

        return $link;
    }

    public function deleteLink(CharacterLink $link): void
    {
        $this->em->remove($link);
        $this->em->flush();
    }

    public function serialize(Person $person): array
    {
        return [
            'id'         => (string) $person->getId(),
            'name'       => $person->getName(),
            'bio'        => $person->getBio(),
            'avatar_url' => $person->getAvatarUrl(),
            'created_at' => $person->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    public function serializeLink(CharacterLink $link): array
    {
        return [
            'id'           => (string) $link->getId(),
            'person_a_id'  => (string) $link->getPersonA()->getId(),
            'person_b_id'  => (string) $link->getPersonB()->getId(),
            'relationship' => $link->getRelationship(),
        ];
    }
}
